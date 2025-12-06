use neon::prelude::*;
use sysinfo::{System, Pid, Signal, ProcessesToUpdate, Networks, Users};
use std::sync::{Arc, Mutex};
use battery::Manager;

// Global system instance to maintain state between calls
lazy_static::lazy_static! {
    static ref SYSTEM: Arc<Mutex<System>> = Arc::new(Mutex::new(System::new_all()));
    static ref NETWORKS: Arc<Mutex<Networks>> = Arc::new(Mutex::new(Networks::new_with_refreshed_list()));
    static ref USERS: Arc<Mutex<Users>> = Arc::new(Mutex::new(Users::new_with_refreshed_list()));
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
    
    Ok(obj)
}

// Get disk I/O information (simplified)
fn get_disk_info(mut cx: FunctionContext) -> JsResult<JsObject> {
    // Note: sysinfo doesn't provide real-time disk I/O stats
    // This would need platform-specific implementation
    let obj = cx.empty_object();
    
    let read = cx.number(0.0);
    obj.set(&mut cx, "read", read)?;
    
    let write = cx.number(0.0);
    obj.set(&mut cx, "write", write)?;
    
    Ok(obj)
}

// Get network I/O information
fn get_network_info(mut cx: FunctionContext) -> JsResult<JsObject> {
    let mut networks = NETWORKS.lock().unwrap();
    networks.refresh();
    
    let obj = cx.empty_object();
    
    let mut total_rx = 0u64;
    let mut total_tx = 0u64;
    
    for (_interface_name, data) in networks.iter() {
        total_rx += data.received();
        total_tx += data.transmitted();
    }
    
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
    obj.set(&mut cx, "memory", mem_obj)?;
    
    // Disk info (placeholder)
    let disk_obj = cx.empty_object();
    let read = cx.number(0.0);
    disk_obj.set(&mut cx, "read", read)?;
    let write = cx.number(0.0);
    disk_obj.set(&mut cx, "write", write)?;
    obj.set(&mut cx, "disk", disk_obj)?;
    
    // Network info
    let net_obj = cx.empty_object();
    let mut networks = NETWORKS.lock().unwrap();
    networks.refresh();
    let mut total_rx = 0u64;
    let mut total_tx = 0u64;
    for (_interface_name, data) in networks.iter() {
        total_rx += data.received();
        total_tx += data.transmitted();
    }
    let rx = cx.number(total_rx as f64);
    net_obj.set(&mut cx, "rx", rx)?;
    let tx = cx.number(total_tx as f64);
    net_obj.set(&mut cx, "tx", tx)?;
    obj.set(&mut cx, "network", net_obj)?;
    
    Ok(obj)
}

// Get list of processes
fn get_processes(mut cx: FunctionContext) -> JsResult<JsArray> {
    let mut sys = SYSTEM.lock().unwrap();
    sys.refresh_processes(ProcessesToUpdate::All);
    
    let process_count = sys.processes().len();
    let processes = JsArray::new(&mut cx, process_count);
    
    for (i, (pid, process)) in sys.processes().iter().enumerate() {
        let obj = cx.empty_object();
        
        let pid_num = cx.number(pid.as_u32() as f64);
        obj.set(&mut cx, "pid", pid_num)?;
        
        let name = cx.string(process.name().to_string_lossy());
        obj.set(&mut cx, "name", name)?;
        
        let cpu = cx.number(process.cpu_usage() as f64);
        obj.set(&mut cx, "cpu", cpu)?;
        
        let memory = cx.number(process.memory() as f64);
        obj.set(&mut cx, "memory", memory)?;
        
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
                    
                    // State of health (0.0 - 1.0) - multiply by 100 to get percentage
                    let health = cx.number((battery.state_of_health().value * 100.0) as f64);
                    obj.set(&mut cx, "health", health)?;
                    
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
    cx.export_function("getProcesses", get_processes)?;
    cx.export_function("getBatteryInfo", get_battery_info)?;
    cx.export_function("killProcess", kill_process)?;
    Ok(())
}
