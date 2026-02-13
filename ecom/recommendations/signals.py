from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Book
from .tasks import generate_embeddings_task

from django.db import transaction

@receiver(post_save, sender=Book)
def trigger_embedding_generation(sender, instance, created, update_fields=None, **kwargs):
    """
    Trigger async embedding generation when a Book is created or its content changes.
    """
    def _trigger():
        generate_embeddings_task.delay([instance.id])

    if created:
        transaction.on_commit(_trigger)
    else:
        # Check if relevant fields changed if update_fields is provided
        if update_fields:
             if 'title' in update_fields or 'description' in update_fields:
                 transaction.on_commit(_trigger)
        else:
             # Standard save() call without update_fields
             # We assume something important might have changed.
             # Check if we are running inside the task itself (bulk_update) - but bulk_update doesn't trigger signals.
             transaction.on_commit(_trigger)
