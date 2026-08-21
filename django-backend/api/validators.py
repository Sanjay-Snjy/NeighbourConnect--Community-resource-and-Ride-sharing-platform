"""File and image validators used by models and serializers."""

from __future__ import annotations

from django.conf import settings
from django.core.exceptions import ValidationError

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}


def validate_image_file(file) -> None:
    """Validate an uploaded image: size, extension, content type, and that the
    bytes actually decode as an image (via Pillow).

    Raises ``django.core.exceptions.ValidationError`` on failure so the message
    surfaces cleanly through DRF serializers.
    """
    max_size = getattr(settings, "MAX_UPLOAD_SIZE", 5 * 1024 * 1024)
    size = getattr(file, "size", None)
    if size is not None and size > max_size:
        raise ValidationError(
            f"Image is too large. Maximum size is {max_size // (1024 * 1024)}MB."
        )

    name = getattr(file, "name", "") or ""
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext and ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            "Unsupported image type. Allowed: "
            f"{', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}."
        )

    content_type = getattr(file, "content_type", None)
    if content_type and content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise ValidationError("Uploaded file is not a valid image.")

    # Verify the bytes are a real, decodable image.
    try:
        from PIL import Image

        pos = file.tell() if hasattr(file, "tell") else None
        image = Image.open(file)
        image.verify()
        if pos is not None and hasattr(file, "seek"):
            file.seek(pos)
    except ValidationError:
        raise
    except Exception as exc:  # noqa: BLE001 - normalize any Pillow error
        raise ValidationError("The uploaded file is not a valid image.") from exc
