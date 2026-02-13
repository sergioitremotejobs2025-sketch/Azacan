from rest_framework import serializers
from ..models import Book, RecommendationFeedback

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = [
            'id', 'stock', 'reference', 'title', 'author', 'price',
            'infantil', 'category', 'description', 'iva', 'image',
            'subjects', 'embedding'
        ]
        read_only_fields = ['id']  # id is auto-generated

    # Optional: make price and iva return as strings with 2 decimals (nice for JSON)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=True)
    iva = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=True)

class RecommendationFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendationFeedback
        fields = ['id', 'user', 'book', 'query', 'is_positive', 'created_at']
        read_only_fields = ['id', 'created_at', 'user'] # user is set by request.user