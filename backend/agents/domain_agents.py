class OfficeAgent:
    def handle(self, message: str) -> str:
        return f"Managing office task: {message}"


class StudentAgent:
    def handle(self, message: str) -> str:
        return f"Handling study task: {message}"


class LifeAgent:
    def handle(self, message: str) -> str:
        return f"Planning life task: {message}"
