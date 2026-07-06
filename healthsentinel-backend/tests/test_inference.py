import os
import json
import pytest
import numpy as np
from unittest.mock import MagicMock, patch

# Import the actual functions from your model/inference.py
from model.inference import model_fn, input_fn, predict_fn, output_fn

# 1. Test Model Loading & Fallbacks (Turns the model_fn lines green)
@patch('model.inference.joblib.load')
@patch('model.inference.os.path.exists')
def test_model_fn(mock_exists, mock_load):
    # Case A: Standard model.pkl path
    mock_exists.side_effect = lambda p: p.endswith("model.pkl")
    model_fn("/dummy/dir")
    mock_load.assert_called_with("/dummy/dir/model.pkl")

    # Case B: Fallback model.joblib path
    mock_exists.side_effect = lambda p: p.endswith("model.joblib")
    model_fn("/dummy/dir")
    mock_load.assert_called_with("/dummy/dir/model.joblib")


# 2. Test Input Parsing & Defensive Handling (Turns input_fn lines green)
def test_input_fn():
    # Case A: Raw JSON array
    res = input_fn('[1, 2, 3]', 'application/json')
    assert np.array_equal(res, np.array([1, 2, 3]))

    # Case B: Dictionary structured with 'data'
    res = input_fn('{"data": [[1, 2]]}', 'application/json')
    assert np.array_equal(res, np.array([[1, 2]]))

    # Case C: Dictionary structured with 'instances'
    res = input_fn('{"instances": [[3, 4]]}', 'application/json')
    assert np.array_equal(res, np.array([[3, 4]]))

    # Case D: Triggers the ValueError branch
    with pytest.raises(ValueError, match="Unsupported content type"):
        input_fn('{}', 'text/plain')


# 3. Test Prediction Compliance (Turns predict_fn lines green)
def test_predict_fn():
    mock_model = MagicMock()
    mock_model.predict.return_value = np.array([1])

    # Case A: Force 2D array reshape if 1D array is passed
    input_1d = np.array([1, 2, 3])
    predict_fn(input_1d, mock_model)
    
    # Case B: Already 2D array path
    input_2d = np.array([[1, 2, 3]])
    predict_fn(input_2d, mock_model)
    mock_model.predict.assert_called()


# 4. Test Output Formatting (Turns output_fn lines green)
def test_output_fn():
    pred = np.array([1, 0, 1])
    
    # Case A: Valid JSON response formatting
    res, content_type = output_fn(pred, 'application/json')
    assert res == '[1, 0, 1]'
    assert content_type == 'application/json'

    # Case B: Triggers the second ValueError branch
    with pytest.raises(ValueError, match="Unsupported accept type"):
        output_fn(pred, 'application/xml')
