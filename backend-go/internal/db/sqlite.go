package db

import (
	"database/sql"
	"path/filepath"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func Open(dataDir string) error {
	path := filepath.Join(dataDir, "namorix.db")
	var err error
	DB, err = sql.Open("sqlite", path)
	if err != nil {
		return err
	}
	return DB.Ping()
}

func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
