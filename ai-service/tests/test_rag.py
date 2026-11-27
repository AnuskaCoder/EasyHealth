import unittest
from unittest.mock import Mock, patch

import requests

from services import rag


class RagServiceTests(unittest.TestCase):
    def test_vector_literal_rejects_unexpected_dimensions(self):
        with self.assertRaises(rag.AIServiceError):
            rag._vector_literal([0.1, 0.2])

    @patch.dict("os.environ", {"DATABASE_URL": "postgresql://example.test/db"})
    @patch("services.rag.index_guideline_corpus", return_value=len(rag.GUIDELINE_CORPUS))
    @patch("services.rag.psycopg.connect")
    def test_ensure_indexes_corpus_when_references_are_missing(self, connect, index):
        connection = connect.return_value.__enter__.return_value
        connection.execute.return_value.fetchone.return_value = (0,)

        result = rag.ensure_guideline_corpus_indexed()

        self.assertEqual(result, len(rag.GUIDELINE_CORPUS))
        index.assert_called_once_with()

    @patch.dict("os.environ", {"DATABASE_URL": "postgresql://example.test/db"})
    @patch("services.rag.index_guideline_corpus")
    @patch("services.rag.psycopg.connect")
    def test_ensure_skips_index_when_corpus_is_complete(self, connect, index):
        connection = connect.return_value.__enter__.return_value
        connection.execute.return_value.fetchone.return_value = (len(rag.GUIDELINE_CORPUS),)

        result = rag.ensure_guideline_corpus_indexed()

        self.assertEqual(result, 0)
        index.assert_not_called()

    @patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"})
    @patch("services.rag._gemini_request")
    def test_embedding_requests_retrieval_task_and_expected_dimensions(self, request):
        request.return_value = {"embedding": {"values": [0.0] * rag.EMBEDDING_DIMENSIONS}}

        values = rag._embed_text("blood pressure question", "RETRIEVAL_QUERY")

        self.assertEqual(len(values), rag.EMBEDDING_DIMENSIONS)
        self.assertEqual(request.call_args.args[1], "embedContent")
        self.assertEqual(request.call_args.args[2]["taskType"], "RETRIEVAL_QUERY")
        self.assertEqual(
            request.call_args.args[2]["outputDimensionality"],
            rag.EMBEDDING_DIMENSIONS,
        )

    @patch.dict("os.environ", {"GEMINI_API_KEY": "test-secret"})
    @patch("services.rag.requests.post")
    def test_upstream_http_error_reports_status_without_exposing_key(self, post):
        error = requests.HTTPError("request failed with key=test-secret")
        error.response = Mock(status_code=401)
        post.side_effect = error

        with self.assertRaises(rag.AIServiceError) as raised:
            rag._gemini_request("gemini-2.5-flash", "generateContent", {})

        self.assertIn("HTTP 401", str(raised.exception))
        self.assertNotIn("test-secret", str(raised.exception))

    @patch("services.rag._generate_answer", return_value="Grounded answer")
    @patch("services.rag._retrieve")
    def test_query_returns_retrieved_sources_without_internal_scores(self, retrieve, _generate):
        retrieve.return_value = [
            {
                "title": "Guideline",
                "authority": "Public health organization",
                "quote": "Consult a qualified clinician.",
                "category": "general",
                "url": "https://example.test/guidance",
                "similarity": 0.8,
            }
        ]

        result = rag.query_rag_engine("What should I ask my clinician?")

        self.assertEqual(result["answer"], "Grounded answer")
        self.assertEqual(result["provider"], "Google Gemini")
        self.assertNotIn("similarity", result["retrieved_sources"][0])

    @patch("services.rag._generate_answer")
    @patch("services.rag._retrieve", return_value=[])
    def test_query_does_not_generate_without_retrieved_sources(self, _retrieve, generate):
        result = rag.query_rag_engine("Question without a source match")

        self.assertEqual(result["retrieved_sources"], [])
        self.assertIn("could not find a matching indexed reference", result["answer"])
        generate.assert_not_called()


if __name__ == "__main__":
    unittest.main()
