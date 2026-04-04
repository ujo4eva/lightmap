FROM python:3.12-slim

LABEL maintainer="LightMap"
LABEL description="Campus Power Monitor IoT Server"

WORKDIR /app

RUN pip install uv

COPY server/pyproject.toml server/uv.lock* ./
RUN uv sync --no-dev

COPY server/ ./server/

ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=server/run.py

EXPOSE 5000

CMD ["uv", "run", "gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "server.app:create_app()"]
