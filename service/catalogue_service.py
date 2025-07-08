from dto.catalogue import Catalogue
from util.db_connector import get_connection
from exceptions.exceptions import CatalogueNotFoundException


class CatalogueService:
    def __init__(self):
        self.conn = get_connection()
    
    @classmethod
    def create_catalogue(cls, catalogue):
        if isinstance(catalogue, dict):
            cat_obj = Catalogue(
                id=None,
                name=catalogue["name"],
                effective_from=catalogue["effective_from"],
                effective_to=catalogue["effective_to"],
                status=catalogue.get("status", "ACTIVE")
            )
        elif isinstance(catalogue, Catalogue):
            cat_obj=catalogue
        else:
            raise TypeError("catalogue must be dict or catalogue")
        
        service = cls()
        query = """
            INSERT INTO catalogue (Name, Effective_From, Effective_To, Status)
            VALUES (%s, %s, %s, %s)
        """
        data = (
            cat_obj.name,
            cat_obj.effective_from,
            cat_obj.effective_to,
            cat_obj.status
        )
        with service.conn.cursor() as cursor:
            cursor.execute(query, data)
            service.conn.commit()
            cat_obj.id = cursor.lastrowid
        return cat_obj



    def delete_catalogue_by_id(self,id):
        with self.conn.cursor() as cursor:
            cursor.execute("DELETE FROM catalogue WHERE Catalogue_ID = %s", (id,))
        self.conn.commit()

    def update_catalogue_by_id(self,id,updated_catalogue: Catalogue):
         query = """
            UPDATE catalogue
            SET Name = %s, 
            Effective_From = %s, 
            Effective_To = %s, 
            Status = %s
            WHERE Catalogue_ID = %s
         """
         data = (
             updated_catalogue.name,
            updated_catalogue.effective_from,
            updated_catalogue.effective_to,
            updated_catalogue.status,
            id
        )
         with self.conn.cursor() as cursor:
             cursor.execute(query, data)
         self.conn.commit()
    
    def get_catalogue_by_id(self, id):
        with self.conn.cursor() as cursor:
            cursor.execute("SELECT * FROM catalogue WHERE Catalogue_ID = %s", (id,))
            row = cursor.fetchone()
        self.conn.commit()
        return Catalogue(*row) if row else None

    def get_all_catalogues(self, sort='desc'):
        order = 'DESC' if sort == 'desc' else 'ASC'
        with self.conn.cursor() as cursor:
            cursor.execute(f"SELECT * FROM catalogue ORDER BY Catalogue_ID {order}")
            rows = cursor.fetchall()
        self.conn.commit()
        return [Catalogue(*row) for row in rows]
