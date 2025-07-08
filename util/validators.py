def validate_cat_id(id):#to check whether it is a valid id or not
    if not id or not isinstance(id, int) or id <=0:
        raise ValueError("Catalogue cant be empty, also Catalogue must be positive integer ")
   
def  validate_cat_name(name):#to check whether the name input is correct or not
    if not name or not name.strip():
        raise ValueError("Catalogue name cant be empty  ")
    

def validate_date_form(date_str):#to check the format of time is correct or not
    from datetime import datetime 
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise ValueError("Date must be in [YYYY-MM-DD] format ")
    

