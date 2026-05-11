package db

type User struct {
	ID       int64  `db:"id"`
	Username string `db:"username"`
	Password string `db:"password"`
	Role     int64  `db:"role"`
	CreateAt string `db:"create_at"`
}

type RefreshToken struct {
	Jti         string `db:"jti"`
	UserID      int64  `db:"user_id"`
	UserAgent   string `db:"user_agent"`
	Fingerprint string `db:"fingerprint"`
	IpAddress   string `db:"ip_address"`
	LastUsedAt  string `db:"last_used_at"`
	CreateAt    string `db:"create_at"`
	ExpiresAt   string `db:"expires_at"`
}

type Settings struct {
	Key   string `db:"key"`
	Value string `db:"value"`
}
