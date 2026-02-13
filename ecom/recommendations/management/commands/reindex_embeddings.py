from django.core.management.base import BaseCommand
from recommendations.models import Book
from recommendations.tasks import generate_embeddings_task

class Command(BaseCommand):
    help = 'Re-generates vector embeddings for all books in the database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=50,
            help='Number of books to process per task'
        )
        parser.add_argument(
            '--missing-only',
            action='store_true',
            help='Only generate embeddings for books that do not have one'
        )

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        missing_only = options['missing_only']
        
        books = Book.objects.all()
        if missing_only:
            books = books.filter(embedding__isnull=True)
            
        book_ids = list(books.values_list('id', flat=True))
        total_books = len(book_ids)
        
        if total_books == 0:
            self.stdout.write("No books found to process.")
            return

        self.stdout.write(f"Scheduling embedding generation for {total_books} books in batches of {batch_size}...")

        task_count = 0
        for i in range(0, total_books, batch_size):
            batch_ids = book_ids[i:i + batch_size]
            generate_embeddings_task.delay(batch_ids)
            task_count += 1
            
        self.stdout.write(self.style.SUCCESS(f"Successfully scheduled {task_count} tasks."))
