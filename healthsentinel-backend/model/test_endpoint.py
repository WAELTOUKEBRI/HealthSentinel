import boto3
import json

# Initialize the SageMaker runtime client
runtime = boto3.client("sagemaker-runtime", region_name="eu-west-3")

# Define a mock sample payload (match the exact number of features your Random Forest expects)
# For example, if your model takes 4 features:
payload = {
    "instances": [
        [0.25, 1.5, 3.2] 
    ]
}

print("Sending request to SageMaker...")
response = runtime.invoke_endpoint(
    EndpointName="healthsentinel-dev-endpoint",
    ContentType="application/json",
    Body=json.dumps(payload)
)

# Parse and print the prediction
result = json.loads(response["Body"].read().decode())
print("🎯 Prediction Result from AWS:", result)
