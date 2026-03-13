import logging
import os
from datetime import datetime
from core import config

def logger_function(name, e, n):
    # Handling Logs
    loggerfunc = logging.getLogger(name)
    loggerfunc.setLevel(logging.INFO)

    date = datetime.now().strftime('%m%d%Y')
    # configure the handler and formatter for logger2
    handlerfunc = logging.FileHandler(os.path.join(config.LOG_FILES['files'], f"{name}{date}.log"), mode='a')
    formatterfunc = logging.Formatter("%(name)s %(asctime)s %(levelname)s %(message)s")

    # add formatter to the handler
    handlerfunc.setFormatter(formatterfunc)
   
    # add handler to the logger
    if not loggerfunc.hasHandlers():
        loggerfunc.addHandler(handlerfunc)

    if n == 1:
        loggerfunc.info(f"{e}")
    if n == 2:
        loggerfunc.exception(f"{e}")
        loggerfunc.error(f"{e}")
        loggerfunc.critical(f"{e}")
