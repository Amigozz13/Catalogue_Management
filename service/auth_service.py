from util.db_connector import get_connection

class AuthService:
    def __init__(self):
        self.conn = get_connection()

    def authenticate(self, username, password):
        with self.conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM admin_user_pass WHERE username = %s AND password = %s",
                (username, password)
            )
            user = cursor.fetchone()
        return user is not None