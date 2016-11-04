import datetime
from flask_login import UserMixin


class User(UserMixin):
    def __init__(self, username, group, location):
        self.username = username
        self.group = group
        self.location = location
        self.hour = str(datetime.datetime.now().hour)
        self.minutes = str(datetime.datetime.now().minute)
        with open('app/users/' + str(username) + '.txt', 'w') as info:
            info.write(str(username) + ' ' + str(group) + ' ' + str(location) + ' ' + self.hour + ' ' + self.minutes)
            info.close()


    def get_id(self):
        return self.username

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def __repr__(self):
        return '<User %r>' % (self.username)