// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    Manager,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_store::StoreExt;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct WindowState {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

/// Dispatch a custom event to the web app frontend
fn dispatch_js_event(app: &tauri::AppHandle, event_name: &str) {
    if let Some(window) = app.get_webview_window("main") {
        let js = format!(
            "document.dispatchEvent(new CustomEvent('{}'))",
            event_name
        );
        let _ = window.eval(&js);
    }
}

/// Save window position and size to store
fn save_window_state(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if let (Ok(position), Ok(size)) = (window.outer_position(), window.outer_size()) {
            let state = WindowState {
                x: position.x as f64,
                y: position.y as f64,
                width: size.width as f64,
                height: size.height as f64,
            };

            if let Ok(store) = app.store("window-state.json") {
                store.set("window", serde_json::to_value(&state).unwrap_or_default());
                let _ = store.save();
            }
        }
    }
}

/// Restore window position and size from store
fn restore_window_state(app: &tauri::AppHandle) {
    if let Ok(store) = app.store("window-state.json") {
        if let Some(value) = store.get("window") {
            if let Ok(state) = serde_json::from_value::<WindowState>(value.clone()) {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_position(tauri::Position::Physical(
                        tauri::PhysicalPosition::new(state.x as i32, state.y as i32),
                    ));
                    let _ = window.set_size(tauri::Size::Physical(
                        tauri::PhysicalSize::new(state.width as u32, state.height as u32),
                    ));
                }
            }
        }
    }
}

/// Inject Tauri detection flag into the web app
fn inject_tauri_flag(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.eval(
            "window.__QUADRANTS_DESKTOP__ = true; window.__QUADRANTS_VERSION__ = '0.2.0';"
        );
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    let cmd_n = Shortcut::new(Some(Modifiers::SUPER), Code::KeyN);
                    let cmd_shift_f = Shortcut::new(
                        Some(Modifiers::SUPER | Modifiers::SHIFT),
                        Code::KeyF,
                    );
                    let cmd_shift_o = Shortcut::new(
                        Some(Modifiers::SUPER | Modifiers::SHIFT),
                        Code::KeyO,
                    );

                    if shortcut == &cmd_n {
                        dispatch_js_event(app, "tauri:new-task");
                    } else if shortcut == &cmd_shift_f {
                        dispatch_js_event(app, "tauri:focus-mode");
                    } else if shortcut == &cmd_shift_o {
                        dispatch_js_event(app, "tauri:organize");
                    }
                }
            })
            .build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            // Build and set menu
            let menu = build_menu(app.handle())?;
            app.set_menu(menu)?;

            // Restore window state
            restore_window_state(app.handle());

            // Inject Tauri detection flag
            inject_tauri_flag(app.handle());

            // Register global shortcuts
            let global_shortcut = app.global_shortcut();
            let _ = global_shortcut.register(Shortcut::new(Some(Modifiers::SUPER), Code::KeyN));
            let _ = global_shortcut.register(Shortcut::new(
                Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyF,
            ));
            let _ = global_shortcut.register(Shortcut::new(
                Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyO,
            ));

            // Listen for window move/resize to save state
            let app_handle = app.handle().clone();
            if let Some(window) = app.get_webview_window("main") {
                let handle_clone = app_handle.clone();
                window.on_window_event(move |event| {
                    match event {
                        tauri::WindowEvent::Moved(_) | tauri::WindowEvent::Resized(_) => {
                            save_window_state(&handle_clone);
                        }
                        tauri::WindowEvent::CloseRequested { .. } => {
                            save_window_state(&handle_clone);
                        }
                        _ => {}
                    }
                });
            }

            Ok(())
        })
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "quit" => {
                    save_window_state(app);
                    app.exit(0);
                }
                "close" => {
                    save_window_state(app);
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.close();
                    }
                }
                "reload" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.eval("window.location.reload()");
                    }
                }
                "minimize" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.minimize();
                    }
                }
                "zoom" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.maximize();
                    }
                }
                // New menu items
                "new_task" => {
                    dispatch_js_event(app, "tauri:new-task");
                }
                "focus_mode" => {
                    dispatch_js_event(app, "tauri:focus-mode");
                }
                "organize_tasks" => {
                    dispatch_js_event(app, "tauri:organize");
                }
                "back_to_projects" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.eval("window.location.href = '/projects'");
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn build_menu(handle: &tauri::AppHandle) -> Result<Menu<tauri::Wry>, tauri::Error> {
    // App menu (macOS)
    let app_menu = Submenu::with_items(
        handle,
        "Quadrants",
        true,
        &[
            &PredefinedMenuItem::about(handle, Some("About Quadrants"), None)?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::services(handle, None)?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::hide(handle, Some("Hide Quadrants"))?,
            &PredefinedMenuItem::hide_others(handle, None)?,
            &PredefinedMenuItem::show_all(handle, None)?,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItem::with_id(handle, "quit", "Quit Quadrants", true, Some("CmdOrCtrl+Q"))?,
        ],
    )?;

    // File menu
    let file_menu = Submenu::with_items(
        handle,
        "File",
        true,
        &[
            &MenuItem::with_id(handle, "new_task", "New Task", true, Some("CmdOrCtrl+N"))?,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItem::with_id(handle, "back_to_projects", "My Projects", true, Some("CmdOrCtrl+1"))?,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItem::with_id(handle, "close", "Close Window", true, Some("CmdOrCtrl+W"))?,
        ],
    )?;

    // Edit menu
    let edit_menu = Submenu::with_items(
        handle,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::undo(handle, None)?,
            &PredefinedMenuItem::redo(handle, None)?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::cut(handle, None)?,
            &PredefinedMenuItem::copy(handle, None)?,
            &PredefinedMenuItem::paste(handle, None)?,
            &PredefinedMenuItem::select_all(handle, None)?,
        ],
    )?;

    // View menu
    let view_menu = Submenu::with_items(
        handle,
        "View",
        true,
        &[
            &MenuItem::with_id(handle, "focus_mode", "Focus Mode", true, Some("CmdOrCtrl+Shift+F"))?,
            &MenuItem::with_id(handle, "organize_tasks", "Organize Tasks", true, Some("CmdOrCtrl+Shift+O"))?,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItem::with_id(handle, "reload", "Reload", true, Some("CmdOrCtrl+R"))?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::fullscreen(handle, None)?,
        ],
    )?;

    // Window menu
    let window_menu = Submenu::with_items(
        handle,
        "Window",
        true,
        &[
            &MenuItem::with_id(handle, "minimize", "Minimize", true, Some("CmdOrCtrl+M"))?,
            &MenuItem::with_id(handle, "zoom", "Zoom", true, None::<&str>)?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::close_window(handle, None)?,
        ],
    )?;

    // Help menu
    let help_menu = Submenu::with_items(
        handle,
        "Help",
        true,
        &[
            &MenuItem::with_id(handle, "learn_more", "Quadrants Help", true, None::<&str>)?,
        ],
    )?;

    Menu::with_items(
        handle,
        &[
            &app_menu,
            &file_menu,
            &edit_menu,
            &view_menu,
            &window_menu,
            &help_menu,
        ],
    )
}
