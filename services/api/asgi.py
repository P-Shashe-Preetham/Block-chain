"""Production ASGI entrypoint.

Importing this module validates the process environment through create_app;
unit tests should import create_app directly and inject Settings explicitly.
"""

from .app import create_app

app = create_app()
