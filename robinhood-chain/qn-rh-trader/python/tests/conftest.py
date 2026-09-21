import pathlib
import sys

# The snippets are standalone scripts that `import common`, so put snippets/ on the path.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "snippets"))
