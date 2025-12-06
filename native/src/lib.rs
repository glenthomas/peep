use neon::prelude::*;
use sysinfo::{System, Pid, Signal, ProcessesToUpdate, Networks, Users, Disks};
use std::sync::{Arc, Mutex};
use battery::Manager;

// Global system instance to maintain state between calls
lazy_static::lazy_static! {
    static ref SYSTEM: Arc<Mutex<System>> = Arc::new(Mutex::new(System::new_all()));
    static ref NETWORKS: Arc<Mutex<Networks>> = Arc::new(Mutex::new(Networks::new_with_refreshed_list()));
    static ref USERS: Arc<Mutex<Users>> = Arc::new(Mutex::new(Users::new_with_refreshed_list()));
    static ref DISKS: Arc<Mutex<Disks>> = Arc::new(Mutex::new(Disks::new_with_refreshed_list()));
}

// Infer network interface type from name (macOS conventions)
fn get_interface_type(name: &str) -> &str {
    if name.starts_with("en") {
        // en0, en1 are typically built-in Ethernet/Wi-Fi
        // en2+ are often USB/Thunderbolt adapters
        "Ethernet/Wi-Fi"
    } else if name.starts_with("fw") {
        "FireWire"
    } else if name.starts_with("p2p") {
        "Peer-to-Peer"
    } else if name.starts_with("bridge") {
        "Bridge"
    } else if name.starts_with("utun") {
        "VPN Tunnel"
    } else if name.starts_with("awdl") {
        "Apple Wireless Direct Link"
    } else {
        "Other"
    }
}

// Get CPU usage information
fn get_cpu_info(mut cx: FunctionContext) -> JsResult<JsObject> {
    let mut sys = SYSTEM.lock().unwrap();
    sys.refresh_cpu_all();
    
    let obj = cx.empty_object();
    
    // Get overall CPU usage
    let usage = cx.number(sys.global_cpu_usage() as f64);
    obj.set(&mut cx, "usage", usage)?;
    
    // Get number of CPU cores
    let cores = cx.number(sys.cpus().len() as f64);
    obj.set(&mut cx, "cores", cores)?;
    
    // Get CPU brand/name (e.g., "Apple M1 Pro")
    if let Some(cpu) = sys.cpus().first() {
        let brand = cx.string(cpu.brand());
        obj.set(&mut cx, "brand", brand)?;
    }
    
    // Get per-core CPU usage
    let cpus = sys.cpus();
    let per_core_array = JsArray::new(&mut cx, cpus.len());
    for (i, cpu) in cpus.iter().enumerate() {
        let core_usage = cx.number(cpu.cpu_usage() as f64);
        per_core_array.set(&mut cx, i as u32, core_usage)?;
    }
    obj.set(&mut cx, "perCore", per_core_array)?;
    
    Ok(obj)
}

// Get memory information
fn get_memory_info(mut cx: FunctionContext) -> JsResult<JsObject> {
    let mut sys = SYSTEM.lock().unwrap();
    sys.refresh_memory();
    
    let obj = cx.empty_object();
    
    let total = cx.number(sys.total_memory() as f64);
    obj.set(&mut cx, "total", total)?;
    
    let used = cx.number(sys.used_memory() as f64);
    obj.set(&mut cx, "used", used)?;
    
    let free = cx.number(sys.free_memory() as f64);
    obj.set(&mut cx, "free", free)?;
    
    // Swap memory info
    let total_swap = cx.number(sys.total_swap() as f64);
    obj.set(&mut cx, "totalSwap", total_swap)?;
    
    let used_swap = cx.number(sys.used_swap() as f64);
    obj.set(&mut cx, "usedSwap", used_swap)?;
    
    let free_swap = cx.number(sys.free_swap() as f64);
    obj.set(&mut cx, "freeSwap", free_swap)?;
    
    Ok(obj)
}

// Get disk I/O information
fn get_disk_info(mut cx: FunctionContext) -> JsResult<JsObject> {
    let mut disks = DISKS.lock().unwrap();
    disks.refresh(true);
    
    let obj = cx.empty_object();
    
    // Calculate total read/write across all disks using DiskUsage
    let mut total_read = 0u64;
    let mut total_write = 0u64;
    
    for disk in disks.list() {
        let usage = disk.usage();
        // Use incremental bytes instead of total to avoid huge numbers
        total_read += usage.read_bytes;
        total_write += usage.written_bytes;
    }
    
    let read = cx.number(total_read as f64);
    obj.set(&mut cx, "read", read)?;
    
    let write = cx.number(total_write as f64);
    obj.set(&mut cx, "write", write)?;
    
    // Get disk usage information (reuse the same disks instance)
    // Filter out redundant system volumes on macOS
    let filtered_disks: Vec<_> = disks.list().iter()
        .filter(|disk| {
            let mount_point = disk.mount_point().to_string_lossy();
            // Skip root volume if /System/Volumes/Data exists (macOS APFS)
            // Also skip other internal system volumes
            if mount_point == "/" {
                // Check if /System/Volumes/Data exists
                !disks.list().iter().any(|d| d.mount_point().to_string_lossy() == "/System/Volumes/Data")
            } else if mount_point.starts_with("/System/Volumes/") && mount_point != "/System/Volumes/Data" {
                // Skip other System/Volumes/* except Data
                false
            } else {
                true
            }
        })
        .collect();
    
    let disks_array = JsArray::new(&mut cx, filtered_disks.len());
    
    for (i, disk) in filtered_disks.iter().enumerate() {
        let disk_obj = cx.empty_object();
        
        let name = cx.string(disk.name().to_string_lossy());
        disk_obj.set(&mut cx, "name", name)?;
        
        let mount_point = cx.string(disk.mount_point().to_string_lossy());
        disk_obj.set(&mut cx, "mountPoint", mount_point)?;
        
        let total_space = cx.number(disk.total_space() as f64);
        disk_obj.set(&mut cx, "totalSpace", total_space)?;
        
        let available_space = cx.number(disk.available_space() as f64);
        disk_obj.set(&mut cx, "availableSpace", available_space)?;
        
        let used_space = cx.number((disk.total_space() - disk.available_space()) as f64);
        disk_obj.set(&mut cx, "usedSpace", used_space)?;
        
        let file_system = cx.string(disk.file_system().to_string_lossy());
        disk_obj.set(&mut cx, "fileSystem", file_system)?;
        
        disks_array.set(&mut cx, i as u32, disk_obj)?;
    }
    
    obj.set(&mut cx, "disks", disks_array)?;
    
    Ok(obj)
}

// Get network I/O information
fn get_network_info(mut cx: FunctionContext) -> JsResult<JsObject> {
    let mut networks = NETWORKS.lock().unwrap();
    networks.refresh(true);
    
    let obj = cx.empty_object();
    
    let mut total_rx = 0u64;
    let mut total_tx = 0u64;
    
    // Filter interfaces: exclude loopback and virtual interfaces, keep physical adapters
    let active_interfaces: Vec<_> = networks.iter()
        .filter(|(name, _data)| {
            // Exclude loopback
            if name.starts_with("lo") {
                return false;
            }
            // Exclude bridge, utun, awdl, llw, and other virtual interfaces
            if name.starts_with("bridge") || name.starts_with("utun") || 
               name.starts_with("awdl") || name.starts_with("llw") ||
               name.starts_with("ap") || name.starts_with("gif") ||
               name.starts_with("stf") {
                return false;
            }
            // Keep all physical adapters (en*, fw*, p2p*, etc.)
            true
        })
        .collect();
    
    // Create array for individual interfaces
    let interfaces_array = JsArray::new(&mut cx, active_interfaces.len());
    
    for (i, (interface_name, data)) in active_interfaces.iter().enumerate() {
        let interface_obj = cx.empty_object();
        
        let name = cx.string(interface_name);
        interface_obj.set(&mut cx, "name", name)?;
        
        let interface_type = cx.string(get_interface_type(interface_name));
        interface_obj.set(&mut cx, "type", interface_type)?;
        
        let received = cx.number(data.received() as f64);
        interface_obj.set(&mut cx, "received", received)?;
        
        let transmitted = cx.number(data.transmitted() as f64);
        interface_obj.set(&mut cx, "transmitted", transmitted)?;
        
        let total_packets_received = cx.number(data.total_packets_received() as f64);
        interface_obj.set(&mut cx, "packetsReceived", total_packets_received)?;
        
        let total_packets_transmitted = cx.number(data.total_packets_transmitted() as f64);
        interface_obj.set(&mut cx, "packetsTransmitted", total_packets_transmitted)?;
        
        interfaces_array.set(&mut cx, i as u32, interface_obj)?;
    }
    
    // Calculate total from all interfaces (not just filtered ones)
    for (_interface_name, data) in networks.iter() {
        total_rx += data.received();
        total_tx += data.transmitted();
    }
    
    obj.set(&mut cx, "interfaces", interfaces_array)?;
    
    let rx = cx.number(total_rx as f64);
    obj.set(&mut cx, "rx", rx)?;
    
    let tx = cx.number(total_tx as f64);
    obj.set(&mut cx, "tx", tx)?;
    
    Ok(obj)
}

// Get all system information
fn get_system_info(mut cx: FunctionContext) -> JsResult<JsObject> {
    let mut sys = SYSTEM.lock().unwrap();
    sys.refresh_all();
    
    let obj = cx.empty_object();
    
    // CPU info
    let cpu_obj = cx.empty_object();
    let cpu_usage = cx.number(sys.global_cpu_usage() as f64);
    cpu_obj.set(&mut cx, "usage", cpu_usage)?;
    let cores = cx.number(sys.cpus().len() as f64);
    cpu_obj.set(&mut cx, "cores", cores)?;
    
    // Get CPU brand/name (e.g., "Apple M1 Pro")
    if let Some(cpu) = sys.cpus().first() {
        let brand = cx.string(cpu.brand());
        cpu_obj.set(&mut cx, "brand", brand)?;
    }
    
    // Get per-core CPU usage
    let cpus = sys.cpus();
    let per_core_array = JsArray::new(&mut cx, cpus.len());
    for (i, cpu) in cpus.iter().enumerate() {
        let core_usage = cx.number(cpu.cpu_usage() as f64);
        per_core_array.set(&mut cx, i as u32, core_usage)?;
    }
    cpu_obj.set(&mut cx, "perCore", per_core_array)?;
    
    obj.set(&mut cx, "cpu", cpu_obj)?;
    
    // Memory info
    let mem_obj = cx.empty_object();
    let total = cx.number(sys.total_memory() as f64);
    mem_obj.set(&mut cx, "total", total)?;
    let used = cx.number(sys.used_memory() as f64);
    mem_obj.set(&mut cx, "used", used)?;
    let free = cx.number(sys.free_memory() as f64);
    mem_obj.set(&mut cx, "free", free)?;
    
    // Swap memory info
    let total_swap = cx.number(sys.total_swap() as f64);
    mem_obj.set(&mut cx, "totalSwap", total_swap)?;
    
    let used_swap = cx.number(sys.used_swap() as f64);
    mem_obj.set(&mut cx, "usedSwap", used_swap)?;
    
    let free_swap = cx.number(sys.free_swap() as f64);
    mem_obj.set(&mut cx, "freeSwap", free_swap)?;
    
    obj.set(&mut cx, "memory", mem_obj)?;
    
    // Disk info with I/O stats using DiskUsage
    let disk_obj = cx.empty_object();
    let mut disks = DISKS.lock().unwrap();
    disks.refresh(true);
    
    // Calculate total read/write across all disks
    let mut total_read = 0u64;
    let mut total_write = 0u64;
    
    for disk in disks.list() {
        let usage = disk.usage();
        // Use incremental bytes instead of total to avoid huge numbers
        total_read += usage.read_bytes;
        total_write += usage.written_bytes;
    }
    
    let read = cx.number(total_read as f64);
    disk_obj.set(&mut cx, "read", read)?;
    let write = cx.number(total_write as f64);
    disk_obj.set(&mut cx, "write", write)?;
    
    // Get disk usage information (filter out redundant system volumes)
    let filtered_disks: Vec<_> = disks.list().iter()
        .filter(|disk| {
            let mount_point = disk.mount_point().to_string_lossy();
            // Skip root volume if /System/Volumes/Data exists (macOS APFS)
            // Also skip other internal system volumes
            if mount_point == "/" {
                // Check if /System/Volumes/Data exists
                !disks.list().iter().any(|d| d.mount_point().to_string_lossy() == "/System/Volumes/Data")
            } else if mount_point.starts_with("/System/Volumes/") && mount_point != "/System/Volumes/Data" {
                // Skip other System/Volumes/* except Data
                false
            } else {
                true
            }
        })
        .collect();
    
    let disks_array = JsArray::new(&mut cx, filtered_disks.len());
    
    for (i, disk) in filtered_disks.iter().enumerate() {
        let disk_info = cx.empty_object();
        
        let name = cx.string(disk.name().to_string_lossy());
        disk_info.set(&mut cx, "name", name)?;
        
        let mount_point = cx.string(disk.mount_point().to_string_lossy());
        disk_info.set(&mut cx, "mountPoint", mount_point)?;
        
        let total_space = cx.number(disk.total_space() as f64);
        disk_info.set(&mut cx, "totalSpace", total_space)?;
        
        let available_space = cx.number(disk.available_space() as f64);
        disk_info.set(&mut cx, "availableSpace", available_space)?;
        
        let used_space = cx.number((disk.total_space() - disk.available_space()) as f64);
        disk_info.set(&mut cx, "usedSpace", used_space)?;
        
        let file_system = cx.string(disk.file_system().to_string_lossy());
        disk_info.set(&mut cx, "fileSystem", file_system)?;
        
        disks_array.set(&mut cx, i as u32, disk_info)?;
    }
    
    disk_obj.set(&mut cx, "disks", disks_array)?;
    obj.set(&mut cx, "disk", disk_obj)?;
    
    // Network info
    let net_obj = cx.empty_object();
    let mut networks = NETWORKS.lock().unwrap();
    networks.refresh(true);
    let mut total_rx = 0u64;
    let mut total_tx = 0u64;
    
    // Filter interfaces: exclude loopback and virtual interfaces, keep physical adapters
    let active_interfaces: Vec<_> = networks.iter()
        .filter(|(name, _data)| {
            // Exclude loopback
            if name.starts_with("lo") {
                return false;
            }
            // Exclude bridge, utun, awdl, llw, and other virtual interfaces
            if name.starts_with("bridge") || name.starts_with("utun") || 
               name.starts_with("awdl") || name.starts_with("llw") ||
               name.starts_with("ap") || name.starts_with("gif") ||
               name.starts_with("stf") {
                return false;
            }
            // Keep all physical adapters (en*, fw*, p2p*, etc.)
            true
        })
        .collect();
    
    // Create array for individual interfaces
    let interfaces_array = JsArray::new(&mut cx, active_interfaces.len());
    
    for (i, (interface_name, data)) in active_interfaces.iter().enumerate() {
        let interface_obj = cx.empty_object();
        
        let name = cx.string(interface_name);
        interface_obj.set(&mut cx, "name", name)?;
        
        let interface_type = cx.string(get_interface_type(interface_name));
        interface_obj.set(&mut cx, "type", interface_type)?;
        
        let received = cx.number(data.received() as f64);
        interface_obj.set(&mut cx, "received", received)?;
        
        let transmitted = cx.number(data.transmitted() as f64);
        interface_obj.set(&mut cx, "transmitted", transmitted)?;
        
        let total_packets_received = cx.number(data.total_packets_received() as f64);
        interface_obj.set(&mut cx, "packetsReceived", total_packets_received)?;
        
        let total_packets_transmitted = cx.number(data.total_packets_transmitted() as f64);
        interface_obj.set(&mut cx, "packetsTransmitted", total_packets_transmitted)?;
        
        interfaces_array.set(&mut cx, i as u32, interface_obj)?;
    }
    
    // Calculate total from all interfaces (not just filtered ones)
    for (_interface_name, data) in networks.iter() {
        total_rx += data.received();
        total_tx += data.transmitted();
    }
    
    net_obj.set(&mut cx, "interfaces", interfaces_array)?;
    let rx = cx.number(total_rx as f64);
    net_obj.set(&mut cx, "rx", rx)?;
    let tx = cx.number(total_tx as f64);
    net_obj.set(&mut cx, "tx", tx)?;
    obj.set(&mut cx, "network", net_obj)?;
    
    Ok(obj)
}

// Get OS information
fn get_os_info(mut cx: FunctionContext) -> JsResult<JsObject> {
    let obj = cx.empty_object();
    
    let os_name = cx.string(System::name().unwrap_or_else(|| "Unknown".to_string()));
    obj.set(&mut cx, "name", os_name)?;
    
    let os_version = cx.string(System::os_version().unwrap_or_else(|| "Unknown".to_string()));
    obj.set(&mut cx, "version", os_version)?;
    
    let kernel_version = cx.string(System::kernel_version().unwrap_or_else(|| "Unknown".to_string()));
    obj.set(&mut cx, "kernelVersion", kernel_version)?;
    
    let hostname = cx.string(System::host_name().unwrap_or_else(|| "Unknown".to_string()));
    obj.set(&mut cx, "hostname", hostname)?;
    
    let uptime = cx.number(System::uptime() as f64);
    obj.set(&mut cx, "uptime", uptime)?;
    
    Ok(obj)
}

// Get list of processes
fn get_processes(mut cx: FunctionContext) -> JsResult<JsArray> {
    let show_threads = cx.argument::<JsBoolean>(0)
        .map(|v| v.value(&mut cx))
        .unwrap_or(false);
    
    let mut sys = SYSTEM.lock().unwrap();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    
    // Optionally filter out threads based on parameter
    let actual_processes: Vec<_> = sys.processes()
        .iter()
        .filter(|(_, process)| {
            if show_threads {
                true // Show everything
            } else {
                // Filter out threads, only keep actual processes
                match process.thread_kind() {
                    Some(_) => false, // This is a thread, exclude it
                    None => true,     // This is a process, include it
                }
            }
        })
        .collect();
    
    let process_count = actual_processes.len();
    let processes = JsArray::new(&mut cx, process_count);
    
    for (i, (pid, process)) in actual_processes.iter().enumerate() {
        let obj = cx.empty_object();
        
        let pid_num = cx.number(pid.as_u32() as f64);
        obj.set(&mut cx, "pid", pid_num)?;
        
        let name = cx.string(process.name().to_string_lossy());
        obj.set(&mut cx, "name", name)?;
        
        // Get parent PID
        let parent_pid = process.parent().map(|p| p.as_u32()).unwrap_or(0);
        let ppid_num = cx.number(parent_pid as f64);
        obj.set(&mut cx, "ppid", ppid_num)?;
        
        // Check if this is a thread
        let is_thread = process.thread_kind().is_some();
        let is_thread_val = cx.boolean(is_thread);
        obj.set(&mut cx, "isThread", is_thread_val)?;
        
        let cpu = cx.number(process.cpu_usage() as f64);
        obj.set(&mut cx, "cpu", cpu)?;
        
        let memory = cx.number(process.memory() as f64);
        obj.set(&mut cx, "memory", memory)?;
        
        // Get process age (uptime in seconds) - current time minus start time
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let start_time = process.start_time();
        let uptime = current_time.saturating_sub(start_time);
        let run_time = cx.number(uptime as f64);
        obj.set(&mut cx, "runTime", run_time)?;
        
        // Get CPU time (total time process has spent on CPU in seconds)
        let cpu_time = cx.number(process.run_time() as f64);
        obj.set(&mut cx, "cpuTime", cpu_time)?;
        
        // Get process status - format it nicely
        let status_str = match process.status() {
            sysinfo::ProcessStatus::Run => "Running",
            sysinfo::ProcessStatus::Sleep => "Sleep",
            sysinfo::ProcessStatus::Idle => "Idle",
            sysinfo::ProcessStatus::Zombie => "Zombie",
            sysinfo::ProcessStatus::Stop => "Stopped",
            sysinfo::ProcessStatus::Dead => "Dead",
            sysinfo::ProcessStatus::Tracing => "Tracing",
            sysinfo::ProcessStatus::Wakekill => "Wakekill",
            sysinfo::ProcessStatus::Waking => "Waking",
            sysinfo::ProcessStatus::Parked => "Parked",
            sysinfo::ProcessStatus::LockBlocked => "Blocked",
            sysinfo::ProcessStatus::UninterruptibleDiskSleep => "DiskSleep",
            _ => "Unknown",
        };
        let status = cx.string(status_str);
        obj.set(&mut cx, "status", status)?;
        
        // Get user name from user ID
        let users = USERS.lock().unwrap();
        let user_name = if let Some(uid) = process.user_id() {
            users.iter()
                .find(|u| u.id() == uid)
                .map(|u| u.name().to_string())
                .unwrap_or_else(|| uid.to_string())
        } else {
            "unknown".to_string()
        };
        let user = cx.string(user_name);
        obj.set(&mut cx, "user", user)?;
        
        // Get process command line
        let cmd = process.cmd();
        let command_str = cmd.iter()
            .map(|s| s.to_string_lossy())
            .collect::<Vec<_>>()
            .join(" ");
        let command = cx.string(command_str);
        obj.set(&mut cx, "command", command)?;
        
        // Get disk I/O statistics
        let disk_usage = process.disk_usage();
        let disk_read = cx.number(disk_usage.read_bytes as f64);
        obj.set(&mut cx, "diskRead", disk_read)?;
        let disk_write = cx.number(disk_usage.written_bytes as f64);
        obj.set(&mut cx, "diskWrite", disk_write)?;
        
        processes.set(&mut cx, i as u32, obj)?;
    }
    
    Ok(processes)
}

// Get battery information
fn get_battery_info(mut cx: FunctionContext) -> JsResult<JsObject> {
    let obj = cx.empty_object();
    
    // Try to get battery information
    match Manager::new() {
        Ok(manager) => {
            if let Some(battery) = manager.batteries().ok().and_then(|mut batteries| batteries.next()) {
                if let Ok(battery) = battery {
                    // Battery is available
                    let available = cx.boolean(true);
                    obj.set(&mut cx, "available", available)?;
                    
                    // State of charge (0.0 - 1.0) - multiply by 100 to get percentage
                    let percentage = cx.number((battery.state_of_charge().value * 100.0) as f64);
                    obj.set(&mut cx, "percentage", percentage)?;
                    
                    // State (charging, discharging, full, etc.)
                    let state = cx.string(format!("{:?}", battery.state()));
                    obj.set(&mut cx, "state", state)?;
                    
                    // State of health - calculate manually as (energy_full / energy_full_design) * 100
                    // This gives us the maximum capacity as a percentage of original design capacity
                    let energy_full_design = battery.energy_full_design().get::<battery::units::energy::watt_hour>();
                    let energy_full = battery.energy_full().get::<battery::units::energy::watt_hour>();
                    let health = if energy_full_design > 0.0 {
                        (energy_full / energy_full_design * 100.0) as f64
                    } else {
                        100.0
                    };
                    let health_num = cx.number(health);
                    obj.set(&mut cx, "health", health_num)?;
                    
                    // Expose design capacity for debugging
                    let design_capacity = cx.number(energy_full_design as f64);
                    obj.set(&mut cx, "energyFullDesign", design_capacity)?;
                    
                    // Time to full (if charging) or empty (if discharging)
                    if let Some(time) = battery.time_to_full() {
                        let minutes = cx.number(time.get::<battery::units::time::minute>() as f64);
                        obj.set(&mut cx, "timeToFull", minutes)?;
                    }
                    
                    if let Some(time) = battery.time_to_empty() {
                        let minutes = cx.number(time.get::<battery::units::time::minute>() as f64);
                        obj.set(&mut cx, "timeToEmpty", minutes)?;
                    }
                    
                    // Energy (current and full capacity in watt-hours)
                    let energy = cx.number(battery.energy().get::<battery::units::energy::watt_hour>() as f64);
                    obj.set(&mut cx, "energy", energy)?;
                    
                    let energy_full = cx.number(battery.energy_full().get::<battery::units::energy::watt_hour>() as f64);
                    obj.set(&mut cx, "energyFull", energy_full)?;
                    // Temperature (if available)
                    if let Some(temp) = battery.temperature() {
                        let celsius = cx.number(temp.get::<battery::units::thermodynamic_temperature::degree_celsius>() as f64);
                        obj.set(&mut cx, "temperature", celsius)?;
                    }
                    
                    return Ok(obj);
                }
            }
            
            // No battery found
            let available = cx.boolean(false);
            obj.set(&mut cx, "available", available)?;
        }
        Err(_) => {
            // Battery manager not available
            let available = cx.boolean(false);
            obj.set(&mut cx, "available", available)?;
        }
    }
    
    Ok(obj)
}

// Kill a process by PID
fn kill_process(mut cx: FunctionContext) -> JsResult<JsObject> {
    let pid_arg = cx.argument::<JsNumber>(0)?;
    let pid = Pid::from_u32(pid_arg.value(&mut cx) as u32);
    
    let obj = cx.empty_object();
    
    let sys = SYSTEM.lock().unwrap();
    
    if let Some(process) = sys.process(pid) {
        let killed = process.kill_with(Signal::Kill).unwrap_or(false);
        
        let success = cx.boolean(killed);
        obj.set(&mut cx, "success", success)?;
        
        let message = if killed {
            cx.string("Process killed successfully")
        } else {
            cx.string("Failed to kill process")
        };
        obj.set(&mut cx, "message", message)?;
    } else {
        let success = cx.boolean(false);
        obj.set(&mut cx, "success", success)?;
        
        let message = cx.string("Process not found");
        obj.set(&mut cx, "message", message)?;
    }
    
    Ok(obj)
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("getCpuInfo", get_cpu_info)?;
    cx.export_function("getMemoryInfo", get_memory_info)?;
    cx.export_function("getDiskInfo", get_disk_info)?;
    cx.export_function("getNetworkInfo", get_network_info)?;
    cx.export_function("getSystemInfo", get_system_info)?;
    cx.export_function("getOsInfo", get_os_info)?;
    cx.export_function("getProcesses", get_processes)?;
    cx.export_function("getBatteryInfo", get_battery_info)?;
    cx.export_function("killProcess", kill_process)?;
    Ok(())
}
