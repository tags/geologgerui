''' This fabfile is for use with deploying javascript-only applications to the cybercommons '''

from fabric.api import *
from fabric.contrib.files import exists
from fabric.colors import red
import os

env.sitename = os.path.basename(os.getcwd())

def statictest():
    """
    Work on staging environment
    """
    env.settings = 'production'
    env.path = '/var/www/html/test/%(sitename)s' % env
    env.hosts = ['tags.animalmigration.org']

def static():
    """
    Work on staging environment
    """
    env.settings = 'production'
    env.path = '/var/www/html/%(sitename)s' % env
    env.hosts = ['tags.animalmigration.org  ']

def setup_directories():
    run('mkdir -p %(path)s' % env)

def setup():
    setup_directories()
    copy_working_dir()

def deploy():
    copy_working_dir()

def copy_working_dir():
    local('tar --exclude fabfile.py --exclude fabfile.pyc -czf /tmp/deploy_%(sitename)s.tgz .' % env)
    put('/tmp/deploy_%(sitename)s.tgz' % env, '%(path)s/deploy_%(sitename)s.tgz' % env)
    run('cd %(path)s; tar -xf deploy_%(sitename)s.tgz; rm deploy_%(sitename)s.tgz' % env)
    local('rm /tmp/deploy_%(sitename)s.tgz' % env)


