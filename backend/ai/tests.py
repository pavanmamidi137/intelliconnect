from django.test import SimpleTestCase

from config.exceptions import AIOutputError
from .providers import GeminiProvider


class GeminiProviderTests(SimpleTestCase):
    def test_extract_text_skips_non_text_parts(self):
        payload = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"thought": True, "text": "internal reasoning"},
                            {"text": '{"summary": "meeting summary"}'},
                        ]
                    }
                }
            ]
        }

        self.assertEqual(
            GeminiProvider._extract_text(payload),
            '{"summary": "meeting summary"}',
        )

    def test_extract_text_rejects_empty_candidates(self):
        with self.assertRaisesMessage(AIOutputError, "Gemini returned no candidates"):
            GeminiProvider._extract_text({"candidates": []})