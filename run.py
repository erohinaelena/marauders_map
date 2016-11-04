#!flask/bin/python
# encoding=utf8  
import sys  

reload(sys)  
sys.setdefaultencoding('utf8')
from app import app
from app.views import load_users

load_users()
app.run(host='192.168.210.39')
