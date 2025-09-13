"""
Google Cloud API Documentation Agent for TEAM_ONE

This agent extends the documentation capabilities to include comprehensive
documentation for Google Cloud Platform APIs and tools available to other agents.
It works with the documentation agent to provide complete API reference.
"""

import os
import re
import json
from typing import Any, Dict, List, Optional
from datetime import datetime

from agents.shared.base_agent import UniversalAgent, tool


class GoogleCloudAPIDocumentationAgent(UniversalAgent):
    """Generates comprehensive documentation for Google Cloud API tools.

    This agent documents all available Google Cloud Platform APIs and tools
    that can be used by other agents in the TEAM_ONE ecosystem. It provides
    detailed API references, usage examples, and integration guides.
    """

    def __init__(
        self,
        agent_id: str = "gcp-api-docs-agent-001",
        role: str = "Document Google Cloud APIs and tools for agents",
        model: str = "claude-sonnet-4",
    ) -> None:
        super().__init__(agent_id, role, model)

    @tool
    def generate_gcp_api_documentation(
        self, 
        toolset_module_path: str,
        output_path: str,
        include_examples: bool = True
    ) -> Dict[str, Any]:
        """Generate comprehensive documentation for Google Cloud API tools.

        Args:
            toolset_module_path: Path to the Google Cloud API toolset module
            output_path: Path to write the generated documentation
            include_examples: Whether to include usage examples

        Returns:
            {
                "written_to": output_path,
                "api_count": number_of_apis,
                "tool_count": number_of_tools,
                "categories": list_of_api_categories
            }
        """
        self.logger.info("Generating GCP API documentation from %s", toolset_module_path)
        
        try:
            # Import and analyze the toolset
            import sys
            import importlib.util
            
            spec = importlib.util.spec_from_file_location("gcp_toolset", toolset_module_path)
            gcp_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(gcp_module)
            
            # Get toolset and tools
            toolset = gcp_module.create_google_cloud_api_toolset()
            tools = toolset.get_tools()
            
            # Organize tools by category
            categories = self._categorize_tools(tools)
            
            # Generate documentation
            doc_content = self._generate_documentation_content(categories, include_examples)
            
            # Write to file
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(doc_content)
            
            return {
                "written_to": output_path,
                "api_count": len(categories),
                "tool_count": len(tools),
                "categories": list(categories.keys())
            }
            
        except Exception as e:
            self.logger.error("Failed to generate GCP API documentation: %s", str(e))
            return {
                "error": str(e),
                "written_to": None,
                "api_count": 0,
                "tool_count": 0,
                "categories": []
            }

    @tool
    def generate_api_usage_examples(
        self,
        api_category: str,
        output_path: str,
        project_id: str = "gen-lang-client-0050235412"
    ) -> Dict[str, Any]:
        """Generate usage examples for a specific Google Cloud API category.

        Args:
            api_category: API category (bigquery, storage, pubsub, etc.)
            output_path: Path to write the examples
            project_id: GCP project ID for examples

        Returns:
            {
                "written_to": output_path,
                "examples_count": number_of_examples,
                "category": api_category
            }
        """
        self.logger.info("Generating usage examples for %s API", api_category)
        
        examples = self._get_api_examples(api_category, project_id)
        
        if not examples:
            return {
                "error": f"No examples available for category: {api_category}",
                "written_to": None,
                "examples_count": 0,
                "category": api_category
            }
        
        # Generate examples content
        content = self._generate_examples_content(api_category, examples, project_id)
        
        # Write to file
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return {
            "written_to": output_path,
            "examples_count": len(examples),
            "category": api_category
        }

    @tool
    def create_agent_integration_guide(
        self,
        output_path: str,
        focus_apis: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create an integration guide for agents using Google Cloud APIs.

        Args:
            output_path: Path to write the integration guide
            focus_apis: Optional list of APIs to focus on

        Returns:
            {
                "written_to": output_path,
                "sections": list_of_guide_sections
            }
        """
        self.logger.info("Creating agent integration guide")
        
        if not focus_apis:
            focus_apis = ["bigquery", "storage", "pubsub", "vertex_ai", "monitoring"]
        
        guide_content = self._generate_integration_guide(focus_apis)
        
        # Write to file
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(guide_content)
        
        sections = [
            "Authentication Setup",
            "Basic Usage Patterns",
            "Error Handling",
            "Best Practices",
            "Common Use Cases",
            "Troubleshooting"
        ]
        
        return {
            "written_to": output_path,
            "sections": sections
        }

    def _categorize_tools(self, tools: List[Any]) -> Dict[str, List[Any]]:
        """Categorize tools by Google Cloud service."""
        categories = {
            "BigQuery": [],
            "Cloud Storage": [],
            "Pub/Sub": [],
            "Vertex AI": [],
            "Monitoring": [],
            "Compute": [],
            "Other": []
        }
        
        for tool in tools:
            tool_name = tool.__name__.lower()
            
            if "bigquery" in tool_name:
                categories["BigQuery"].append(tool)
            elif "storage" in tool_name:
                categories["Cloud Storage"].append(tool)
            elif "pubsub" in tool_name:
                categories["Pub/Sub"].append(tool)
            elif "vertex" in tool_name or "ai" in tool_name:
                categories["Vertex AI"].append(tool)
            elif "monitor" in tool_name or "metrics" in tool_name:
                categories["Monitoring"].append(tool)
            elif "compute" in tool_name or "instance" in tool_name:
                categories["Compute"].append(tool)
            else:
                categories["Other"].append(tool)
        
        # Remove empty categories
        return {k: v for k, v in categories.items() if v}

    def _generate_documentation_content(
        self, 
        categories: Dict[str, List[Any]], 
        include_examples: bool
    ) -> str:
        """Generate the main documentation content."""
        
        lines = [
            "# Google Cloud Platform API Tools Documentation",
            "",
            "This document provides comprehensive documentation for all Google Cloud Platform",
            "API tools available to TEAM_ONE agents. These tools provide programmatic access",
            "to Google Cloud services with automatic authentication via the MCP credentials server.",
            "",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "## Table of Contents",
            ""
        ]
        
        # Add table of contents
        for category in categories.keys():
            lines.append(f"- [{category}](#{category.lower().replace(' ', '-')})")
        lines.append("")
        
        # Add authentication section
        lines.extend([
            "## Authentication",
            "",
            "All tools automatically authenticate using the MCP GCP credentials server.",
            "No additional authentication setup is required - the toolset handles:",
            "",
            "- Application Default Credentials (ADC) setup",
            "- Token acquisition and refresh",
            "- Project ID resolution",
            "- Scope validation",
            "",
            "```python",
            "from multi_tool_agent.agent import create_agent",
            "",
            "# Create agent with all Google Cloud tools",
            "agent = create_agent(",
            "    name='gcp_agent',",
            "    description='Agent with Google Cloud Platform access'",
            ")",
            "",
            "# Tools are automatically available",
            "gcp_tools = [tool for tool in agent.tools if 'bigquery' in tool.__name__ or 'storage' in tool.__name__]",
            "```",
            ""
        ])
        
        # Document each category
        for category, tools in categories.items():
            lines.extend([
                f"## {category}",
                "",
                f"### Available Tools ({len(tools)})",
                ""
            ])
            
            for tool in tools:
                lines.extend([
                    f"#### `{tool.__name__}`",
                    "",
                    f"**Description:** {tool.__doc__ or 'No description available'}",
                    ""
                ])
                
                # Add function signature if available
                try:
                    import inspect
                    sig = inspect.signature(tool)
                    lines.extend([
                        "**Parameters:**",
                        f"```python",
                        f"{tool.__name__}{sig}",
                        "```",
                        ""
                    ])
                except:
                    pass
                
                if include_examples:
                    example = self._get_tool_example(tool.__name__, category)
                    if example:
                        lines.extend([
                            "**Example:**",
                            "```python",
                            example,
                            "```",
                            ""
                        ])
                
                lines.append("---")
                lines.append("")
        
        # Add common patterns section
        lines.extend([
            "## Common Usage Patterns",
            "",
            "### Error Handling",
            "",
            "All tools return standardized response formats:",
            "",
            "```python",
            "result = execute_bigquery_query('SELECT 1 as test')",
            "",
            "if result.get('status') == 'success':",
            "    rows = result['rows']",
            "    print(f'Query returned {len(rows)} rows')",
            "else:",
            "    print(f'Query failed: {result.get(\"error\")}')",
            "```",
            "",
            "### Batch Operations",
            "",
            "```python",
            "# Process multiple datasets",
            "datasets_result = list_bigquery_datasets()",
            "if datasets_result['status'] == 'success':",
            "    for dataset in datasets_result['datasets']:",
            "        tables_result = list_bigquery_tables(dataset['dataset_id'])",
            "        if tables_result['status'] == 'success':",
            "            print(f\"Dataset {dataset['dataset_id']} has {len(tables_result['tables'])} tables\")",
            "```",
            "",
            "## Best Practices",
            "",
            "1. **Always check status**: All tools return a 'status' field indicating success/error",
            "2. **Handle errors gracefully**: Tools return error details in the 'error' field",
            "3. **Use appropriate scopes**: The MCP server validates all requested scopes",
            "4. **Monitor quota usage**: Google Cloud APIs have usage quotas and limits",
            "5. **Cache results when possible**: Avoid redundant API calls",
            "",
            "## Troubleshooting",
            "",
            "### Common Issues",
            "",
            "**Authentication Errors**",
            "- Verify MCP credentials server is running",
            "- Check that service account has necessary IAM permissions",
            "- Ensure Application Default Credentials are set up",
            "",
            "**API Errors**",
            "- Check Google Cloud Console for service status",
            "- Verify project ID and resource names",
            "- Review API quotas and limits",
            "",
            "**Permission Errors**",
            "- Ensure service account has required IAM roles",
            "- Check that APIs are enabled in Google Cloud Console",
            "- Verify scope permissions in MCP server configuration",
            ""
        ])
        
        return "\n".join(lines)

    def _get_tool_example(self, tool_name: str, category: str) -> Optional[str]:
        """Get usage example for a specific tool."""
        
        examples = {
            "execute_bigquery_query": """
# Execute a simple query
result = execute_bigquery_query(
    query="SELECT name, count FROM `bigquery-public-data.usa_names.usa_1910_2013` LIMIT 10"
)

if result['status'] == 'success':
    for row in result['rows']:
        print(f"Name: {row['name']}, Count: {row['count']}")
""".strip(),
            
            "list_bigquery_datasets": """
# List all datasets in the project
result = list_bigquery_datasets()

if result['status'] == 'success':
    print(f"Found {len(result['datasets'])} datasets:")
    for dataset in result['datasets']:
        print(f"  - {dataset['dataset_id']} (Location: {dataset['location']})")
""".strip(),
            
            "list_storage_buckets": """
# List all Cloud Storage buckets
result = list_storage_buckets()

if result['status'] == 'success':
    print(f"Found {len(result['buckets'])} buckets:")
    for bucket in result['buckets']:
        print(f"  - {bucket['name']} ({bucket['storage_class']} in {bucket['location']})")
""".strip(),
            
            "upload_to_storage": """
# Upload content to a bucket
content = "Hello, Cloud Storage!"
result = upload_to_storage(
    bucket_name="my-bucket",
    object_name="hello.txt",
    content=content,
    content_type="text/plain"
)

if result['status'] == 'success':
    print(f"Uploaded {result['size']} bytes to {result['object_name']}")
""".strip(),
            
            "publish_pubsub_message": """
# Publish a message to a Pub/Sub topic
result = publish_pubsub_message(
    topic_id="my-topic",
    message="Hello, Pub/Sub!",
    attributes={"source": "agent", "timestamp": "2023-12-01"}
)

if result['status'] == 'success':
    print(f"Published message with ID: {result['message_id']}")
""".strip()
        }
        
        return examples.get(tool_name)

    def _get_api_examples(self, api_category: str, project_id: str) -> List[Dict[str, Any]]:
        """Get comprehensive examples for an API category."""
        
        examples_map = {
            "bigquery": [
                {
                    "title": "Basic Query Execution",
                    "description": "Execute a simple SELECT query",
                    "code": f"""
# Execute a query against a public dataset
result = execute_bigquery_query('''
    SELECT 
        name, 
        number 
    FROM `bigquery-public-data.usa_names.usa_1910_2013` 
    WHERE state = 'CA' 
    ORDER BY number DESC 
    LIMIT 10
''')

if result['status'] == 'success':
    print(f"Query processed {{result['bytes_processed']}} bytes")
    for row in result['rows']:
        print(f"{{row['name']}}: {{row['number']}}")
else:
    print(f"Query failed: {{result['error']}}")
""".strip()
                },
                {
                    "title": "Dataset and Table Management",
                    "description": "List datasets and tables",
                    "code": """
# List all datasets
datasets = list_bigquery_datasets()

for dataset in datasets['datasets']:
    print(f"Dataset: {dataset['dataset_id']}")
    
    # List tables in each dataset
    tables = list_bigquery_tables(dataset['dataset_id'])
    if tables['status'] == 'success':
        for table in tables['tables']:
            print(f"  Table: {table['table_id']} ({table['num_rows']} rows)")
""".strip()
                }
            ],
            "storage": [
                {
                    "title": "Bucket Operations",
                    "description": "List buckets and objects",
                    "code": """
# List all buckets
buckets = list_storage_buckets()

for bucket in buckets['buckets']:
    print(f"Bucket: {bucket['name']} in {bucket['location']}")
    
    # List objects in bucket
    objects = list_storage_objects(bucket['name'])
    if objects['status'] == 'success':
        for obj in objects['objects'][:5]:  # Show first 5 objects
            print(f"  Object: {obj['name']} ({obj['size']} bytes)")
""".strip()
                },
                {
                    "title": "Upload Files",
                    "description": "Upload data to Cloud Storage",
                    "code": """
import json

# Upload JSON data
data = {"timestamp": "2023-12-01", "value": 42}
json_content = json.dumps(data, indent=2)

result = upload_to_storage(
    bucket_name="my-data-bucket",
    object_name="data/sample.json",
    content=json_content,
    content_type="application/json"
)

if result['status'] == 'success':
    print(f"Uploaded to: {result['public_url']}")
""".strip()
                }
            ]
        }
        
        return examples_map.get(api_category.lower(), [])

    def _generate_examples_content(
        self, 
        api_category: str, 
        examples: List[Dict[str, Any]], 
        project_id: str
    ) -> str:
        """Generate examples content for a specific API category."""
        
        lines = [
            f"# {api_category.title()} API Examples",
            "",
            f"This document provides practical examples for using {api_category} API tools",
            f"in TEAM_ONE agents.",
            "",
            f"**Project ID:** `{project_id}`",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            ""
        ]
        
        for i, example in enumerate(examples, 1):
            lines.extend([
                f"## Example {i}: {example['title']}",
                "",
                example['description'],
                "",
                "```python",
                example['code'],
                "```",
                ""
            ])
        
        return "\n".join(lines)

    def _generate_integration_guide(self, focus_apis: List[str]) -> str:
        """Generate integration guide content."""
        
        lines = [
            "# Google Cloud APIs Integration Guide for TEAM_ONE Agents",
            "",
            "This guide helps you integrate Google Cloud Platform APIs into your TEAM_ONE agents.",
            "",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "## Quick Start",
            "",
            "### 1. Create an Agent with Google Cloud Tools",
            "",
            "```python",
            "from multi_tool_agent.agent import create_agent",
            "",
            "# Create agent with all available tools",
            "agent = create_agent(",
            "    name='cloud_data_agent',",
            "    description='Agent for Google Cloud data operations',",
            "    instruction='''",
            "    You are a data analysis agent with access to Google Cloud Platform.",
            "    You can help users query BigQuery datasets, manage Cloud Storage objects,",
            "    and work with other Google Cloud services. Always check the status of",
            "    API responses and handle errors appropriately.",
            "    '''",
            ")",
            "",
            "# Show available Google Cloud tools",
            "gcp_tools = [tool for tool in agent.tools ",
            "             if any(svc in tool.__name__ for svc in ['bigquery', 'storage', 'pubsub'])]",
            "print(f'Available GCP tools: {len(gcp_tools)}')",
            "```",
            "",
            "### 2. Using Tools in Agent Instructions",
            "",
            "```python",
            "agent = create_agent(",
            "    name='analytics_agent',",
            "    instruction='''",
            "    You are an analytics agent. When users ask about data:",
            "    ",
            "    1. First, use list_bigquery_datasets() to see available data",
            "    2. Use list_bigquery_tables() to explore specific datasets",  
            "    3. Use execute_bigquery_query() to run SQL queries",
            "    4. For file operations, use Cloud Storage tools",
            "    5. Always explain what you're doing and show results clearly",
            "    '''",
            ")",
            "```",
            "",
            "## Authentication Setup",
            "",
            "Authentication is handled automatically by the MCP credentials server.",
            "Your agents don't need to worry about:",
            "",
            "- Service account keys",
            "- Access tokens",
            "- Token refresh",
            "- Scope management",
            "",
            "The system automatically:",
            "",
            "1. Sets up Application Default Credentials",
            "2. Configures the correct project ID",
            "3. Handles token lifecycle management",
            "4. Validates API permissions",
            "",
            "## Error Handling Patterns",
            "",
            "### Standard Response Format",
            "",
            "All Google Cloud tools return responses in this format:",
            "",
            "```python",
            "# Success response",
            "{",
            "    'status': 'success',",
            "    'data': { ... },",
            "    # Additional fields specific to the operation",
            "}",
            "",
            "# Error response", 
            "{",
            "    'status': 'error',",
            "    'error': 'Detailed error message',",
            "    # Context fields that were provided",
            "}",
            "```",
            "",
            "### Recommended Error Handling",
            "",
            "```python",
            "def safe_bigquery_query(query):",
            "    '''Execute BigQuery with proper error handling.'''",
            "    result = execute_bigquery_query(query)",
            "    ",
            "    if result.get('status') == 'success':",
            "        return {",
            "            'success': True,",
            "            'rows': result['rows'],",
            "            'job_id': result['job_id']",
            "        }",
            "    else:",
            "        return {",
            "            'success': False,",
            "            'error': result.get('error', 'Unknown error'),",
            "            'query': query",
            "        }",
            "```",
            "",
            "## Best Practices",
            "",
            "### 1. Resource Management",
            "",
            "```python",
            "# List resources before operations",
            "datasets = list_bigquery_datasets()",
            "if datasets['status'] == 'success':",
            "    available_datasets = [d['dataset_id'] for d in datasets['datasets']]",
            "    print(f'Available datasets: {available_datasets}')",
            "```",
            "",
            "### 2. Query Optimization",
            "",
            "```python",
            "# Use LIMIT for exploratory queries",
            "result = execute_bigquery_query('''",
            "    SELECT * FROM `project.dataset.table`",
            "    LIMIT 100",
            "''')",
            "",
            "# Use dry_run to check query validity",
            "result = execute_bigquery_query(",
            "    query='SELECT COUNT(*) FROM `project.dataset.large_table`',",
            "    job_config={'dry_run': True}",
            ")",
            "```",
            "",
            "### 3. Batch Operations",
            "",
            "```python",
            "# Process multiple items efficiently", 
            "def process_all_buckets():",
            "    buckets_result = list_storage_buckets()",
            "    ",
            "    if buckets_result['status'] != 'success':",
            "        return {'error': buckets_result['error']}",
            "    ",
            "    results = []",
            "    for bucket in buckets_result['buckets']:",
            "        objects = list_storage_objects(bucket['name'])",
            "        results.append({",
            "            'bucket': bucket['name'],",
            "            'object_count': len(objects.get('objects', []))",
            "        })",
            "    ",
            "    return {'buckets': results}",
            "```",
            "",
            "## Common Use Cases",
            ""
        ]
        
        # Add use cases for each focused API
        use_cases = {
            "bigquery": {
                "title": "BigQuery Data Analysis",
                "examples": [
                    "Query public datasets for research",
                    "Analyze user behavior data", 
                    "Generate reports from data warehouse",
                    "Data validation and quality checks"
                ]
            },
            "storage": {
                "title": "Cloud Storage Operations",
                "examples": [
                    "Store and retrieve ML model artifacts",
                    "Backup and archive data",
                    "Share files between services",
                    "Static website hosting"
                ]
            },
            "pubsub": {
                "title": "Messaging and Events",
                "examples": [
                    "Send notifications between agents",
                    "Queue tasks for processing",
                    "Real-time data streaming",
                    "Event-driven architectures"
                ]
            }
        }
        
        for api in focus_apis:
            if api in use_cases:
                use_case = use_cases[api]
                lines.extend([
                    f"### {use_case['title']}",
                    ""
                ])
                
                for example in use_case['examples']:
                    lines.append(f"- {example}")
                
                lines.append("")
        
        lines.extend([
            "## Troubleshooting",
            "",
            "### Debug Mode",
            "",
            "Enable debug logging to see detailed API interactions:",
            "",
            "```python",
            "import logging",
            "logging.getLogger('google.cloud').setLevel(logging.DEBUG)",
            "```",
            "",
            "### Common Issues",
            "",
            "**Permission Denied**",
            "- Check service account IAM roles",
            "- Verify API is enabled in Google Cloud Console",
            "- Confirm scope permissions in MCP config",
            "",
            "**Quota Exceeded**", 
            "- Review API quotas in Google Cloud Console",
            "- Implement exponential backoff for retries",
            "- Consider request batching",
            "",
            "**Resource Not Found**",
            "- Verify resource names and project ID",
            "- Check resource exists in correct region",
            "- Ensure proper resource permissions",
            "",
            "### Getting Help",
            "",
            "1. Check the main documentation: `README_GCP_INTEGRATION.md`",
            "2. Run integration tests: `python3 test_gcp_integration.py`",
            "3. Review Google Cloud Console for service status",
            "4. Check agent logs for detailed error messages",
            ""
        ])
        
        return "\n".join(lines)


# Helper function to work with the main documentation agent
def enhance_documentation_with_gcp_apis(base_docs_dir: str, output_dir: str) -> Dict[str, Any]:
    """Enhance existing documentation with Google Cloud API documentation.
    
    Args:
        base_docs_dir: Directory containing base documentation
        output_dir: Directory to write enhanced documentation
        
    Returns:
        Results of documentation enhancement
    """
    gcp_doc_agent = GoogleCloudAPIDocumentationAgent()
    
    # Generate main API documentation
    main_doc_result = gcp_doc_agent.generate_gcp_api_documentation(
        toolset_module_path="/Users/aloe/Documents/TEAM_ONE/multi_tool_agent/toolsets/google_cloud_api_toolset.py",
        output_path=f"{output_dir}/google_cloud_apis.md",
        include_examples=True
    )
    
    # Generate integration guide
    integration_result = gcp_doc_agent.create_agent_integration_guide(
        output_path=f"{output_dir}/gcp_integration_guide.md",
        focus_apis=["bigquery", "storage", "pubsub", "vertex_ai"]
    )
    
    # Generate examples for key APIs
    examples_results = []
    for api in ["bigquery", "storage", "pubsub"]:
        result = gcp_doc_agent.generate_api_usage_examples(
            api_category=api,
            output_path=f"{output_dir}/examples/{api}_examples.md"
        )
        examples_results.append(result)
    
    return {
        "main_documentation": main_doc_result,
        "integration_guide": integration_result,
        "examples": examples_results,
        "total_files": len(examples_results) + 2
    }
