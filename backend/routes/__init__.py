from flask import Blueprint

catalogs_bp = Blueprint('catalogs', __name__)
inventory_bp = Blueprint('inventory', __name__)
orders_bp = Blueprint('orders', __name__)
analytics_bp = Blueprint('analytics', __name__)
system_bp = Blueprint('system', __name__)

from . import catalogs, inventory, orders, analytics, system
