from celery import shared_task
from recommendations.models import Book
from recommendations.rag import get_sentence_transformer_model
import logging

logger = logging.getLogger(__name__)

@shared_task
def generate_embeddings_task(book_ids):
    """
    Asynchronous task to generate vector embeddings for a list of books.
    Args:
        book_ids (list): List of Book IDs to process.
    """
    logger.info(f"Starting embedding generation for {len(book_ids)} books.")
    try:
        model = get_sentence_transformer_model()
        books_to_update = []
        
        books = Book.objects.filter(id__in=book_ids)
        if not books.exists():
            logger.warning("No books found for provided IDs.")
            return "No books processed."

        for book in books:
            try:
                # Combine title and description for richer context
                text = f"{book.title} {book.description or ''}"
                embedding = model.encode(text).tolist()
                book.embedding = embedding
                books_to_update.append(book)
            except Exception as e:
                logger.error(f"Error generating embedding for book {book.id}: {e}")

        if books_to_update:
            Book.objects.bulk_update(books_to_update, ['embedding'])
            logger.info(f"Successfully updated embeddings for {len(books_to_update)} books.")
            return f"Updated {len(books_to_update)} books."
        return "No updates made."

    except Exception as e:
        logger.error(f"Task failed: {e}")
        return f"Failed: {e}"
