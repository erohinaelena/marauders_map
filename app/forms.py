from flask_wtf import Form
from wtforms import StringField
from wtforms import validators


class LoginForm(Form):
    username = StringField('Login:', [validators.DataRequired()])
    group = StringField('Group:',
                        [validators.AnyOf(values=['504', '503', '603'], message='There is no such group in AU.')])
    location = StringField('Where are you?', [validators.DataRequired()])

    def __init__(self, *args, **kwargs):
        kwargs['csrf_enabled'] = False
        Form.__init__(self, *args, **kwargs)
