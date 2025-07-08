import mysql.connector
from configparser import ConfigParser
import os
from exceptions.exceptions import DatabaseConnectionError


def get_connection():
    config = ConfigParser()
    config_path = os.path.join(os.path.dirname(__file__), ".." , "config" , "config.ini")
    config.read(config_path)

    if 'CATALOGUES' not in config:
        raise DatabaseConnectionError("missing [CATALOGUES] section in config file ")
    
    try:
        conn = mysql.connector.connect(
            host     = config['CATALOGUES']['host'],
            user     = config['CATALOGUES']['user'],
            password = config['CATALOGUES']['password'],
            database = config['CATALOGUES']['database']
        )
        conn.autocommit = True
        return conn
    
    except mysql.connector.Error as error:
        raise DatabaseConnectionError(f"database connection failed: {error}")
