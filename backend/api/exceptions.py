"""Custom DRF exception handling.

Normalizes error responses to a consistent shape and prevents leaking raw
server errors to clients.

    {"detail": "<human message>", "errors": {<field>: [<msgs>]}}
"""

from __future__ import annotations

import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("api")


def friendly_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception → don't leak internals.
        logger.exception("Unhandled API exception", exc_info=exc)
        return Response(
            {"detail": "Something went wrong on our end. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    data = response.data
    normalized: dict = {}

    if isinstance(data, dict):
        if "detail" in data and len(data) == 1:
            normalized["detail"] = str(data["detail"])
        else:
            # Field validation errors.
            normalized["detail"] = "Please review the highlighted fields."
            normalized["errors"] = data
    elif isinstance(data, list):
        normalized["detail"] = data[0] if data else "Request could not be processed."
        normalized["errors"] = {"non_field_errors": data}
    else:
        normalized["detail"] = str(data)

    response.data = normalized
    return response
