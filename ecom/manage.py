#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

def instrument_app():
    if os.environ.get("ENABLE_OTEL", "false").lower() != "true":
        return

    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
        from opentelemetry.sdk.resources import Resource
        
        from opentelemetry.instrumentation.django import DjangoInstrumentor
        from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
        from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
        from opentelemetry.instrumentation.requests import RequestsInstrumentor

        service_name = os.environ.get("OTEL_SERVICE_NAME", "django-backend")
        resource = Resource.create(attributes={
            "service.name": service_name,
        })

        provider = TracerProvider(resource=resource)
        # OTLPSpanExporter reads OTEL_EXPORTER_OTLP_ENDPOINT from env
        processor = BatchSpanProcessor(OTLPSpanExporter())
        provider.add_span_processor(processor)
        trace.set_tracer_provider(provider)

        DjangoInstrumentor().instrument()
        Psycopg2Instrumentor().instrument(skip_dep_check=True)
        HTTPXClientInstrumentor().instrument()
        RequestsInstrumentor().instrument()
        
    except Exception as e:
        print(f"Warning: Failed to initialize OpenTelemetry: {e}")

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecom.settings')
    
    # Instrument immediately on startup
    instrument_app()

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
