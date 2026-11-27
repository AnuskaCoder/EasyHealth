"""Create/update the demo guideline embeddings in the configured PostgreSQL database."""
from services.rag import index_guideline_corpus


if __name__ == "__main__":
    count = index_guideline_corpus()
    print(f"Indexed {count} curated guideline passages.")
