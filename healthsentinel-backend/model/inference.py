import joblib
import os
import json
import numpy as np

def model_fn(model_dir):
    """
    Load the model from the directory.
    Ensure "model.pkl" matches the exact name packaged in your model.tar.gz
    """
    model_path = os.path.join(model_dir, "model.pkl")
    if not os.path.exists(model_path):
        # Fallback check in case it was named model.joblib
        alt_path = os.path.join(model_dir, "model.joblib")
        if os.path.exists(alt_path):
            model_path = alt_path
            
    return joblib.load(model_path)

def input_fn(request_body, request_content_type):
    """
    Parse incoming JSON requests defensively.
    Handles raw arrays [[...]] or structured objects {"data": [[...]]}
    """
    if request_content_type == 'application/json':
        payload = json.loads(request_body)
        
        # If backend sends {"data": [...]} or {"instances": [...]}
        if isinstance(payload, dict):
            if 'data' in payload:
                payload = payload['data']
            elif 'instances' in payload:
                payload = payload['instances']
                
        return np.array(payload)
    else:
        raise ValueError(f"Unsupported content type: {request_content_type}")

def predict_fn(input_data, model):
    """
    Make prediction using the loaded model.
    """
    # Force 2D array for scikit-learn compliance if a single record is passed
    if input_data.ndim == 1:
        input_data = input_data.reshape(1, -1)

    return model.predict(input_data)

def output_fn(prediction, accept):
    """
    Format the prediction result for the response.
    """
    if accept == 'application/json':
        return json.dumps(prediction.tolist()), 'application/json'
    raise ValueError(f"Unsupported accept type: {accept}")
