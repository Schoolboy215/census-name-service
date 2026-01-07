use sqlx::Connection;
// provides `try_next`
use futures_util::TryStreamExt;
// provides `try_get`
use sqlx::Row;

use ratatui::{DefaultTerminal, Frame};

fn main() -> color_eyre::Result<()> {
    color_eyre::install()?;
    ratatui::run(app)?;
    Ok(())
}

fn app(terminal: &mut DefaultTerminal) -> std::io::Result<()> {
    loop {
        terminal.draw(render)?;
        if crossterm::event::read()?.is_key_press() {
            break Ok(());
        }
    }
}

fn render(frame: &mut Frame) {
    frame.render_widget("hello world", frame.area());
}

// let conn = SqliteConnection::connect("postgres://neondb_owner:npg_waFLBphG18Zk@ep-steep-cloud-a6qn2pmg-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require").await?;
// sqlx::query("SELECT * FROM CENSUS_NAMES.apiKeys").execute(&mut conn).await?;