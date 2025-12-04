use neon::prelude::*;
use sysinfo::{System, Pid, Signal, ProcessesToUpdate, Networks};
use std::sync::{Arc, Mutex};

// Global system instance to maintain state between calls
lazy_static::lazy_static! {
    static ref SYSTEM: Arc<Mutex<System>> = Arc::new(Mutex::new(System::new_all()));
    static ref NETWORKS: Arc<Mutex<Networks>> = Arc::new(Mutex::new(Networks::new_with_refreshed_list()));
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
        
        let user_id = process.user_id()
            .map(|uid| uid.to_string())
            .unwrap_or_else(|| "unknown".to_string());
        let user = cx.string(user_id);
        obj.set(&mut cx, "user", user)?;
        
        processes.set(&mut cx, i as u32, obj)?;
    }
    
    Ok(processes)
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
    cx.export_function("killProcess", kill_process)?;
    Ok(())
}
