import os

target = os.path.join(os.path.dirname(__file__), 'core', 'management', 'commands', 'seed_restaurants.py')
if os.path.exists(target):
    os.remove(target)
    print(f'Deleted: {target}')
else:
    print('File not found, may already be deleted.')
