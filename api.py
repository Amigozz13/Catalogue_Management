from flask import Flask, request, jsonify, render_template, redirect, send_from_directory
import os
from flask_cors import CORS
import logging
import logging.config

from flask_swagger_ui import get_swaggerui_blueprint

# Import your service and DTO
from service.catalogue_service import CatalogueService
from service.auth_service import AuthService
from dto.catalogue import Catalogue

# Configure logging
logging.config.fileConfig(os.path.join(os.path.dirname(__file__), 'config', 'logging.conf'))
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

SWAGGER_URL = "/docs"
API_URL = "/swagger/swagger.yaml"
swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={ "app_name" : "Catalogue Mangagement API"}
)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

# Instantiate your service
catalogue_service = CatalogueService()
auth_service = AuthService()

@app.route('/')
def index():
    # Redirect to login page served from /login/login.html
    return redirect('/login')

@app.route('/catalogues', methods=['GET'])
def get_all_catalogues():
    sort = request.args.get('sort', 'desc').lower()
    catalogues = catalogue_service.get_all_catalogues(sort)
    return jsonify([vars(c) for c in catalogues])

@app.route('/catalogues/<int:cat_id>', methods=['GET'])
def get_catalogue(cat_id):
    cat = catalogue_service.get_catalogue_by_id(cat_id)
    if not cat:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(vars(cat))

@app.route('/catalogues', methods=['POST'])
def create_catalogue():
    data = request.json
    try:
        status = data.get('status', 'ACTIVE')
        status = status.capitalize() if status else 'ACTIVE'
        cat = Catalogue(
            None,
            data.get('name'),
            data.get('effective_from'),
            data.get('effective_to'),
            status
        )
        catalogue_service.create_catalogue(cat)
        return jsonify({'message': 'Created'}), 201
    except Exception as e:
        logger.error(f"Error creating catalogue: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/catalogues/<int:cat_id>', methods=['PUT'])
def update_catalogue(cat_id):
    data = request.json
    try:
        status = data.get('status', 'ACTIVE')
        status = status.capitalize() if status else 'ACTIVE'
        cat = Catalogue(
            cat_id,
            data.get('name'),
            data.get('effective_from'),
            data.get('effective_to'),
            status
        )
        catalogue_service.update_catalogue_by_id(cat_id, cat)
        return jsonify({'message': 'Updated'})
    except Exception as e:
        logger.error(f"Error updating catalogue {cat_id}: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/catalogues/<int:cat_id>', methods=['DELETE'])
def delete_catalogue(cat_id):
    try:
        catalogue_service.delete_catalogue_by_id(cat_id)
        return jsonify({'message': 'Deleted'})
    except Exception as e:
        logger.error(f"Error deleting catalogue {cat_id}: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/login/<path:filename>')
def serve_login(filename):
    login_folder = os.path.join(os.path.dirname(__file__), '..', 'login')
    return send_from_directory(login_folder, filename)

@app.route('/login', methods=['GET'])
def login_page():
    login_folder = os.path.join(os.path.dirname(__file__), '..', 'login')
    return send_from_directory(login_folder, 'login.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if auth_service.authenticate(username, password):
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Wrong username or password'}), 401

@app.route('/login/')
def login_slash_redirect():
    return redirect('/login')

@app.route('/catalogue_manager')
def catalogue_manager():
    return render_template('catalogue_manager.html')

if __name__ == '__main__':
    app.run(debug=True)