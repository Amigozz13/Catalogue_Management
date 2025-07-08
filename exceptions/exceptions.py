class CatalogueException(Exception):
    pass

class CatalogueNotFoundException(CatalogueException):
    pass

class DatabaseConnectionError(CatalogueException):
    pass

class InvalidCatalogueInputException(CatalogueException):
    pass