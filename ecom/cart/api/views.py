from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from store.models import Product
from ..cart import Cart

class CartAPIView(APIView):
    """
    API View to handle cart operations.
    """

    def get(self, request):
        """
        Get cart summary.
        """
        cart = Cart(request)
        cart_products = cart.get_prods()
        quantities = cart.get_quants()
        total = cart.car_total()

        products_data = []
        for product in cart_products:
            qty = quantities[str(product.id)]
            # Fix legacy format if needed
            if isinstance(qty, dict):
                qty = qty['quantity']
            
            products_data.append({
                'id': product.id,
                'name': product.name,
                'price': float(product.price),
                'sale_price': float(product.sale_price) if product.is_sale else None,
                'is_sale': product.is_sale,
                'image': product.image.url if product.image else None,
                'quantity': qty,
                'total_price': float((product.sale_price if product.is_sale else product.price) * qty)
            })

        return Response({
            'products': products_data,
            'total': float(total),
            'count': len(cart_products)
        })

    def post(self, request):
        """
        Add product to cart.
        Expected JSON: { "product_id": 1, "quantity": 1 }
        """
        cart = Cart(request)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response({'error': 'Product ID required'}, status=status.HTTP_400_BAD_REQUEST)

        product = get_object_or_404(Product, id=product_id)
        cart.add(product=product, quantity=quantity)

        return Response({'message': 'Product added to cart', 'cart_count': cart.__len__()}, status=status.HTTP_200_OK)

    def patch(self, request):
        """
        Update product quantity in cart.
        Expected JSON: { "product_id": 1, "quantity": 2 }
        """
        cart = Cart(request)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response({'error': 'Product ID required'}, status=status.HTTP_400_BAD_REQUEST)

        # Cart.update expects product object or ID. The class implementation handles both.
        product = get_object_or_404(Product, id=product_id)
        cart.update(product=product, quantity=quantity)

        return Response({'message': 'Cart updated', 'cart_count': cart.__len__()}, status=status.HTTP_200_OK)

    def delete(self, request):
        """
        Remove product from cart.
        Expected JSON: { "product_id": 1 }
        """
        cart = Cart(request)
        product_id = request.data.get('product_id')
        
        if not product_id:
             # Try getting from query params if not in body
             product_id = request.query_params.get('product_id')

        if not product_id:
            return Response({'error': 'Product ID required'}, status=status.HTTP_400_BAD_REQUEST)

        product = get_object_or_404(Product, id=product_id)
        cart.remove(product=product)

        return Response({'message': 'Product removed from cart', 'cart_count': cart.__len__()}, status=status.HTTP_200_OK)
