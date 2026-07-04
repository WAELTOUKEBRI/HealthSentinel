import sagemaker
from sagemaker.sklearn.model import SKLearnModel

# Configuration
model_data = "s3://wael-toukebri-healthsentinel-state-v2/model.tar.gz"
role = "arn:aws:iam::856021349334:role/service-role/AmazonSageMakerAdminIAMExecutionRole"

# Define the SKLearn model matching your local 1.4.2 version
model = SKLearnModel(
    model_data=model_data,
    role=role,
    entry_point="inference.py",
    framework_version="1.4-2",  # Matches your local environment
    py_version="py3"
)

# Deploy
print("Deploying HealthSentinel endpoint...")
predictor = model.deploy(
    initial_instance_count=1,
    instance_type="ml.t2.medium",
    endpoint_name="healthsentinel-dev-endpoint"
)

print(f"Successfully Deployed! Endpoint name: {predictor.endpoint_name}")
