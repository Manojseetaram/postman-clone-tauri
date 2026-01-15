#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod protocols;
mod models;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::universal::send_universal
        ])
        .run(tauri::generate_context!())
        .expect("error running tauri");
}
