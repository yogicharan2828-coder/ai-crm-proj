from io import BytesIO
import base64

from pypdf import PdfReader


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
}

ALLOWED_PDF_TYPE = "application/pdf"

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB per file

MAX_DOCUMENTS = 3

MAX_PDF_IMAGES = 3


# ---------------------------------------------------------
# File validation
# ---------------------------------------------------------

def validate_file(
    file_content: bytes,
    content_type: str,
    filename: str,
):
    if not file_content:
        raise ValueError(
            "The uploaded file is empty."
        )

    if len(file_content) > MAX_FILE_SIZE:
        raise ValueError(
            "File size must be 10 MB or less per file."
        )

    allowed_types = {
        ALLOWED_PDF_TYPE,
        *ALLOWED_IMAGE_TYPES,
    }

    if content_type not in allowed_types:
        raise ValueError(
            "Unsupported file type. "
            "Please upload a PDF, JPG, or PNG file."
        )

    if not filename:
        raise ValueError(
            "A valid filename is required."
        )


# ---------------------------------------------------------
# Base64 image encoding
# ---------------------------------------------------------

def encode_image(
    file_content: bytes,
    content_type: str,
) -> str:
    """
    Convert raw image bytes into a base64 data URL.

    Example:
    data:image/png;base64,iVBORw0KGgo...
    """

    encoded = base64.b64encode(
        file_content
    ).decode("utf-8")

    return (
        f"data:{content_type};base64,{encoded}"
    )


# ---------------------------------------------------------
# PDF text extraction
# ---------------------------------------------------------

def extract_pdf_text(
    file_content: bytes,
) -> str:

    try:
        reader = PdfReader(
            BytesIO(file_content)
        )

        pages = []

        for page_number, page in enumerate(
            reader.pages,
            start=1,
        ):
            text = page.extract_text() or ""

            if text.strip():
                pages.append(
                    f"--- Page {page_number} ---\n"
                    f"{text.strip()}"
                )

        extracted_text = "\n\n".join(
            pages
        )

        return extracted_text.strip()

    except Exception as error:
        raise ValueError(
            f"Unable to read the PDF: {str(error)}"
        )


# ---------------------------------------------------------
# Extract embedded images from PDF
# ---------------------------------------------------------

def extract_pdf_images(
    file_content: bytes,
):
    """
    Extract embedded images from a PDF when
    pypdf exposes them through page.images.

    Returns a list of dictionaries containing
    image metadata and base64 data URLs.
    """

    images = []

    try:
        reader = PdfReader(
            BytesIO(file_content)
        )

        for page_number, page in enumerate(
            reader.pages,
            start=1,
        ):

            # pypdf exposes embedded images
            # through page.images on supported PDFs.
            try:
                page_images = page.images
            except Exception:
                page_images = []

            for image_index, image in enumerate(
                page_images,
                start=1,
            ):

                if len(images) >= MAX_PDF_IMAGES:
                    return images

                try:
                    image_bytes = image.data

                    image_name = (
                        getattr(
                            image,
                            "name",
                            None,
                        )
                        or f"page_{page_number}_image_{image_index}.png"
                    )

                    # Determine MIME type from filename.
                    lower_name = image_name.lower()

                    if lower_name.endswith(
                        ".jpg"
                    ) or lower_name.endswith(
                        ".jpeg"
                    ):
                        mime_type = "image/jpeg"

                    else:
                        mime_type = "image/png"

                    images.append(
                        {
                            "name": image_name,
                            "mime_type": mime_type,
                            "data": encode_image(
                                image_bytes,
                                mime_type,
                            ),
                            "source": "pdf",
                            "page": page_number,
                        }
                    )

                except Exception as image_error:
                    print(
                        "Unable to extract PDF image:",
                        image_error,
                    )

        return images

    except Exception as error:
        print(
            "PDF image extraction warning:",
            error,
        )

        return []


# ---------------------------------------------------------
# Process a single document
# ---------------------------------------------------------

def process_document(
    file_content: bytes,
    content_type: str,
    filename: str,
):
    """
    Process one uploaded PDF/image.

    PDF:
        - extracts text
        - attempts embedded image extraction

    Image:
        - preserves actual image data
        - creates base64 data URL
    """

    validate_file(
        file_content=file_content,
        content_type=content_type,
        filename=filename,
    )

    # -----------------------------------------------------
    # PDF
    # -----------------------------------------------------

    if content_type == ALLOWED_PDF_TYPE:

        text = extract_pdf_text(
            file_content
        )

        images = extract_pdf_images(
            file_content
        )

        return {
            "filename": filename,
            "file_type": "pdf",
            "text": text or None,
            "images": images,
        }

    # -----------------------------------------------------
    # IMAGE
    # -----------------------------------------------------

    if content_type in ALLOWED_IMAGE_TYPES:

        image_data = encode_image(
            file_content,
            content_type,
        )

        return {
            "filename": filename,
            "file_type": "image",
            "text": None,
            "images": [
                {
                    "name": filename,
                    "mime_type": content_type,
                    "data": image_data,
                    "source": "direct_upload",
                    "page": None,
                }
            ],
        }

    raise ValueError(
        "Unsupported document type."
    )


# ---------------------------------------------------------
# Process multiple documents
# ---------------------------------------------------------

def process_documents(
    documents,
):
    """
    Process up to 3 uploaded documents.

    documents should contain dictionaries like:

    {
        "file_content": bytes,
        "content_type": "application/pdf",
        "filename": "report.pdf"
    }
    """

    if not documents:
        raise ValueError(
            "No documents were uploaded."
        )

    if len(documents) > MAX_DOCUMENTS:
        raise ValueError(
            f"You can upload a maximum of "
            f"{MAX_DOCUMENTS} files at once."
        )

    results = []

    combined_text_parts = []

    all_images = []

    for document in documents:

        result = process_document(
            file_content=document[
                "file_content"
            ],
            content_type=document[
                "content_type"
            ],
            filename=document[
                "filename"
            ],
        )

        results.append(result)

        # ---------------------------------------------
        # Collect extracted text
        # ---------------------------------------------

        if result.get("text"):

            combined_text_parts.append(
                f"===== {result['filename']} =====\n"
                f"{result['text']}"
            )

        # ---------------------------------------------
        # Collect images
        # ---------------------------------------------

        document_images = (
            result.get("images") or []
        )

        for image in document_images:

            if len(all_images) >= 3:
                break

            all_images.append(image)

    combined_text = "\n\n".join(
        combined_text_parts
    ).strip()

    return {
        "documents": results,
        "text": combined_text or None,
        "images": all_images,
    }