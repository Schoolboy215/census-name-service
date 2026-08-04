use std::time::Duration;

use chrono::NaiveDateTime;
use color_eyre::Result;
use crossterm::event::{self, Event, KeyCode, KeyEventKind};
use ratatui::{
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    widgets::{Block, Borders, Cell, Clear, Paragraph, Row, Table, TableState},
    Frame,
};
use sqlx::{postgres::PgPoolOptions, PgPool, Row as SqlRow};
use uuid::Uuid;

// ── Data ─────────────────────────────────────────────────────────────────────

#[derive(Clone)]
struct ApiKey {
    id: i32,
    key: Option<Uuid>,
    email: String,
    created: Option<NaiveDateTime>,
    uses: Option<i32>,
    last_use: Option<NaiveDateTime>,
}

// ── App state ─────────────────────────────────────────────────────────────────

#[derive(PartialEq)]
enum Screen {
    KeyList,
    NewKeyInput,
    DeleteConfirm,
}

struct App {
    screen: Screen,
    keys: Vec<ApiKey>,
    table_state: TableState,
    email_input: String,
    status: String,
}

impl App {
    fn new(keys: Vec<ApiKey>) -> Self {
        let mut table_state = TableState::default();
        table_state.select(if keys.is_empty() { None } else { Some(0) });
        Self {
            screen: Screen::KeyList,
            keys,
            table_state,
            email_input: String::new(),
            status: String::new(),
        }
    }

    fn selected(&self) -> Option<&ApiKey> {
        self.table_state.selected().and_then(|i| self.keys.get(i))
    }

    fn next_row(&mut self) {
        if self.keys.is_empty() {
            return;
        }
        let next = self
            .table_state
            .selected()
            .map(|i| (i + 1).min(self.keys.len() - 1))
            .unwrap_or(0);
        self.table_state.select(Some(next));
    }

    fn prev_row(&mut self) {
        if self.keys.is_empty() {
            return;
        }
        let prev = self
            .table_state
            .selected()
            .map(|i| i.saturating_sub(1))
            .unwrap_or(0);
        self.table_state.select(Some(prev));
    }

    fn reload(&mut self, keys: Vec<ApiKey>) {
        let prev = self.table_state.selected().unwrap_or(0);
        self.keys = keys;
        self.table_state.select(if self.keys.is_empty() {
            None
        } else {
            Some(prev.min(self.keys.len() - 1))
        });
    }
}

// ── Database ──────────────────────────────────────────────────────────────────

async fn load_keys(pool: &PgPool) -> Result<Vec<ApiKey>> {
    let rows = sqlx::query(
        r#"SELECT id, key, email, created, uses, "lastUse" as last_use
           FROM "CENSUS_NAMES"."apiKeys"
           ORDER BY id"#,
    )
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|r| ApiKey {
            id: r.get("id"),
            key: r.get("key"),
            email: r.get("email"),
            created: r.get("created"),
            uses: r.get("uses"),
            last_use: r.get("last_use"),
        })
        .collect())
}

async fn create_key(pool: &PgPool, email: &str) -> Result<()> {
    sqlx::query(r#"INSERT INTO "CENSUS_NAMES"."apiKeys" (email) VALUES ($1)"#)
        .bind(email)
        .execute(pool)
        .await?;
    Ok(())
}

async fn delete_key(pool: &PgPool, id: i32) -> Result<()> {
    sqlx::query(r#"DELETE FROM "CENSUS_NAMES"."apiKeys" WHERE id = $1"#)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

// ── Rendering ─────────────────────────────────────────────────────────────────

fn render(frame: &mut Frame, app: &mut App) {
    let area = frame.area();

    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3), // title
            Constraint::Min(0),    // table
            Constraint::Length(3), // status bar
        ])
        .split(area);

    // Title
    frame.render_widget(
        Paragraph::new("Census Name Service — API Key Manager").style(
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        ).block(Block::default().borders(Borders::ALL)),
        chunks[0],
    );

    // Key table
    let header = Row::new(
        ["ID", "Email", "Key", "Created", "Uses", "Last Use"]
            .iter()
            .map(|h| Cell::from(*h).style(Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD))),
    )
    .height(1)
    .bottom_margin(1);

    let rows: Vec<Row> = app
        .keys
        .iter()
        .map(|k| {
            Row::new(vec![
                Cell::from(k.id.to_string()),
                Cell::from(k.email.clone()).style(Style::default().fg(Color::White)),
                Cell::from(k.key.map(|u| u.to_string()).unwrap_or_else(|| "—".into())),
                Cell::from(
                    k.created
                        .map(|t| t.format("%Y-%m-%d %H:%M").to_string())
                        .unwrap_or_else(|| "—".into()),
                ),
                Cell::from(k.uses.unwrap_or(0).to_string()),
                Cell::from(
                    k.last_use
                        .map(|t| t.format("%Y-%m-%d %H:%M").to_string())
                        .unwrap_or_else(|| "Never".into()),
                ),
            ])
        })
        .collect();

    let table = Table::new(
        rows,
        [
            Constraint::Length(5),
            Constraint::Min(20),
            Constraint::Length(36),
            Constraint::Length(17),
            Constraint::Length(5),
            Constraint::Length(17),
        ],
    )
    .header(header)
    .block(Block::default().borders(Borders::ALL).title(" Keys "))
    .row_highlight_style(Style::default().bg(Color::DarkGray).add_modifier(Modifier::BOLD))
    .highlight_symbol(">> ");

    frame.render_stateful_widget(table, chunks[1], &mut app.table_state);

    // Status / help bar
    let block = if app.status.is_empty() {
        Block::default().borders(Borders::ALL)
    } else {
        Block::default().borders(Borders::ALL).title(format!(" {} ", app.status))
    };
    frame.render_widget(
        Paragraph::new("[n] New  [d] Delete  [↑/↓] Navigate  [r] Refresh  [q] Quit")
            .style(Style::default().fg(Color::Gray))
            .block(block),
        chunks[2],
    );

    // Modal overlays
    match app.screen {
        Screen::NewKeyInput => render_new_key_modal(frame, app, area),
        Screen::DeleteConfirm => render_delete_modal(frame, app, area),
        Screen::KeyList => {}
    }
}

fn centered_rect(width: u16, height: u16, within: Rect) -> Rect {
    let x = within.x + within.width.saturating_sub(width) / 2;
    let y = within.y + within.height.saturating_sub(height) / 2;
    Rect::new(x, y, width.min(within.width), height.min(within.height))
}

fn render_new_key_modal(frame: &mut Frame, app: &App, area: Rect) {
    let popup = centered_rect(54, 7, area);
    frame.render_widget(Clear, popup);

    let block = Block::default()
        .title(" New API Key ")
        .borders(Borders::ALL)
        .style(Style::default().fg(Color::Green));
    let inner = block.inner(popup);
    frame.render_widget(block, popup);

    let rows = Layout::default()
        .direction(Direction::Vertical)
        .margin(1)
        .constraints([
            Constraint::Length(1),
            Constraint::Length(1),
            Constraint::Length(1),
        ])
        .split(inner);

    frame.render_widget(Paragraph::new("Email address:"), rows[0]);
    frame.render_widget(
        Paragraph::new(app.email_input.as_str())
            .style(Style::default().fg(Color::White).add_modifier(Modifier::UNDERLINED)),
        rows[1],
    );
    frame.render_widget(
        Paragraph::new("[Enter] Confirm  [Esc] Cancel")
            .style(Style::default().fg(Color::DarkGray)),
        rows[2],
    );
}

fn render_delete_modal(frame: &mut Frame, app: &App, area: Rect) {
    let email = app
        .selected()
        .map(|k| k.email.clone())
        .unwrap_or_else(|| "unknown".into());

    let popup = centered_rect(54, 6, area);
    frame.render_widget(Clear, popup);

    let block = Block::default()
        .title(" Confirm Delete ")
        .borders(Borders::ALL)
        .style(Style::default().fg(Color::Red));
    let inner = block.inner(popup);
    frame.render_widget(block, popup);

    let rows = Layout::default()
        .direction(Direction::Vertical)
        .margin(1)
        .constraints([Constraint::Length(1), Constraint::Length(1)])
        .split(inner);

    frame.render_widget(Paragraph::new(format!("Delete key for {}?", email)), rows[0]);
    frame.render_widget(
        Paragraph::new("[y] Yes  [n / Esc] No")
            .style(Style::default().fg(Color::DarkGray)),
        rows[1],
    );
}

// ── Input handling ────────────────────────────────────────────────────────────

/// Returns `true` if the app should exit.
async fn handle_key(key: crossterm::event::KeyEvent, app: &mut App, pool: &PgPool) -> Result<bool> {
    if key.kind != KeyEventKind::Press {
        return Ok(false);
    }

    match app.screen {
        Screen::KeyList => match key.code {
            KeyCode::Char('q') => return Ok(true),
            KeyCode::Down => app.next_row(),
            KeyCode::Up => app.prev_row(),
            KeyCode::Char('n') => {
                app.email_input.clear();
                app.status.clear();
                app.screen = Screen::NewKeyInput;
            }
            KeyCode::Char('d') => {
                if app.selected().is_some() {
                    app.status.clear();
                    app.screen = Screen::DeleteConfirm;
                }
            }
            KeyCode::Char('r') => match load_keys(pool).await {
                Ok(keys) => {
                    app.reload(keys);
                    app.status = "Refreshed.".into();
                }
                Err(e) => app.status = format!("Error refreshing: {e}"),
            },
            _ => {}
        },

        Screen::NewKeyInput => match key.code {
            KeyCode::Esc => app.screen = Screen::KeyList,
            KeyCode::Enter => {
                let email = app.email_input.trim().to_string();
                if !email.is_empty() {
                    match create_key(pool, &email).await {
                        Ok(()) => match load_keys(pool).await {
                            Ok(keys) => {
                                app.reload(keys);
                                app.status = format!("Created key for {email}.");
                            }
                            Err(e) => app.status = format!("Created key but failed to refresh: {e}"),
                        },
                        Err(e) => app.status = format!("Error: {e}"),
                    }
                    app.screen = Screen::KeyList;
                }
            }
            KeyCode::Char(c) => app.email_input.push(c),
            KeyCode::Backspace => { app.email_input.pop(); }
            _ => {}
        },

        Screen::DeleteConfirm => match key.code {
            KeyCode::Char('y') => {
                if let Some(entry) = app.selected().cloned() {
                    match delete_key(pool, entry.id).await {
                        Ok(()) => match load_keys(pool).await {
                            Ok(keys) => {
                                app.reload(keys);
                                app.status = format!("Deleted key for {}.", entry.email);
                            }
                            Err(e) => app.status = format!("Deleted but failed to refresh: {e}"),
                        },
                        Err(e) => app.status = format!("Error: {e}"),
                    }
                }
                app.screen = Screen::KeyList;
            }
            KeyCode::Char('n') | KeyCode::Esc => app.screen = Screen::KeyList,
            _ => {}
        },
    }

    Ok(false)
}

// ── Main loop ─────────────────────────────────────────────────────────────────

async fn run(terminal: &mut ratatui::DefaultTerminal, app: &mut App, pool: &PgPool) -> Result<()> {
    loop {
        terminal.draw(|f| render(f, app))?;

        if event::poll(Duration::from_millis(200))? {
            if let Event::Key(key) = event::read()? {
                if handle_key(key, app, pool).await? {
                    break;
                }
            }
        }
    }
    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    dotenvy::dotenv().ok();

    let db_url = std::env::var("DATABASE_URL_UNPOOLED")
        .or_else(|_| std::env::var("DATABASE_URL"))
        .expect("DATABASE_URL_UNPOOLED or DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(2)
        .connect(&db_url)
        .await?;

    let keys = load_keys(&pool).await?;
    let mut app = App::new(keys);

    let mut terminal = ratatui::init();
    let result = run(&mut terminal, &mut app, &pool).await;
    ratatui::restore();

    result
}
