class Catalogue:
    def __init__(self, id, name, effective_from, effective_to, status="ACTIVE"):
        self.id = id
        self.name = name
        self.effective_from = effective_from
        self.effective_to = effective_to
        self.status = status.capitalize() if status else "ACTIVE"

    def __str__(self):
        return (
            f"Catalogue ID : {self.id},"
            f"Name : {self.name}, "
            f"Start : {self.effective_from},"
            f"End : {self.effective_to},"
            f"Status : {self.status}"
        )