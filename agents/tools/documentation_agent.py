import os
import re
from typing import Any

from agents.shared.base_agent import UniversalAgent, tool


class DocumentationAgent(UniversalAgent):
    """Generates documentation for the agent ecosystem.

    Scans the agents directory, identifies agent modules and their primary tools,
    and emits a markdown summary file. Also provides a tool to summarize
    recent agent actions from the AGENT_ACTIONS.md log.
    """

    def __init__(
        self,
        agent_id: str = "documentation-agent-001",
        role: str = "Generate documentation for agents and their tools",
        model: str = "openai/gpt-5-chat",
    ) -> None:
        super().__init__(agent_id, role, model)

    @tool
    def generate_agents_overview(self, agents_dir: str, output_path: str) -> dict[str, Any]:
        """Generate a markdown overview of agents and their primary tools.

        Args:
            agents_dir: Path to the agents directory to scan.
            output_path: Path to write the generated markdown.
        Returns:
            {"written_to": output_path, "count": N}
        """
        self.logger.info("Generating agents overview from %s", agents_dir)
        skip = {"__init__", "base_agent", "adk_adapter"}
        entries: list[tuple[str, str | None, str | None]] = []
        for fname in sorted(os.listdir(agents_dir)):
            if not fname.endswith(".py"):
                continue
            name = fname[:-3]
            if name in skip:
                continue
            # Find class docstring, model default, and first @tool method name
            primary_tool = None
            description = None
            try:
                with open(os.path.join(agents_dir, fname), encoding="utf-8") as f:
                    content = f.read()
                # First class docstring
                m_doc = re.search(
                    r"class\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(.*?\):\n\s+\"\"\"(.*?)\"\"\"",
                    content,
                    re.DOTALL,
                )
                if m_doc:
                    description = " ".join(m_doc.group(2).strip().split())[:280]
                # Model default in __init__ signature
                m_model = re.search(
                    r"def\s+__init__\s*\(.*?model:\s*str\s*=\s*\"(.*?)\"",
                    content,
                    re.DOTALL,
                )
                model_val = m_model.group(1) if m_model else None
                # First @tool method name
                m_tool = re.search(r"@tool\s*\ndef\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(", content)
                if m_tool:
                    primary_tool = m_tool.group(1)
            except Exception:
                pass
            # Pack description with model in parentheses if found
            if description and "model_val" in locals() and model_val:
                description = f"{description} (model: {model_val})"
            entries.append((name, primary_tool, description))

        lines = [
            "# Agents Overview",
            "",
            "This document lists all agents and their primary tool (if detected).",
            "",
        ]
        for name, tool_name, desc in entries:
            line = f"- {name}"
            if tool_name:
                line += f": `{tool_name}`"
            if desc:
                line += f" — {desc}"
            lines.append(line)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        return {"written_to": output_path, "count": len(entries)}

    @tool
    def summarize_action_logs(self, actions_file: str) -> dict[str, Any]:
        """Summarize the AGENT_ACTIONS.md log with counts per agent and per tool.

        Args:
            actions_file: Path to the AGENT_ACTIONS.md log file.
        Returns:
            {"total": N, "by_agent": {...}, "by_tool": {...}}
        """
        self.logger.info("Summarizing action logs from %s", actions_file)
        if not os.path.exists(actions_file):
            return {"total": 0, "by_agent": {}, "by_tool": {}}
        total = 0
        by_agent: dict[str, int] = {}
        by_tool: dict[str, int] = {}
        with open(actions_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                # format: - 2025-... | agent.tool: {...}
                total += 1
                try:
                    rhs = line.split("|", 1)[1].strip()
                    agent_tool = rhs.split(":", 1)[0].strip()
                    agent, tool = agent_tool.split(".", 1)
                    by_agent[agent] = by_agent.get(agent, 0) + 1
                    by_tool[tool] = by_tool.get(tool, 0) + 1
                except Exception:
                    # ignore parse errors
                    pass
        return {"total": total, "by_agent": by_agent, "by_tool": by_tool}

    @tool
    def get_gcp_api_documentation_info(self, docs_dir: str = None) -> dict[str, Any]:
        """Get information about available Google Cloud API documentation.

        Args:
            docs_dir: Path to the docs directory (optional)
        Returns:
            Information about GCP API documentation files
        """
        if not docs_dir:
            # Default to the docs/gcp_apis directory in the project
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            docs_dir = os.path.join(project_root, "docs", "gcp_apis")
        
        self.logger.info("Checking GCP API documentation at %s", docs_dir)
        
        if not os.path.exists(docs_dir):
            return {
                "available": False,
                "docs_dir": docs_dir,
                "files": [],
                "message": "GCP API documentation not found. Run 'python3 simple_gcp_docs_generator.py' to generate."
            }
        
        doc_files = []
        examples_dir = os.path.join(docs_dir, "examples")
        
        # Check for main documentation files
        main_files = [
            "README.md",
            "google_cloud_apis.md", 
            "integration_guide.md"
        ]
        
        for file in main_files:
            file_path = os.path.join(docs_dir, file)
            if os.path.exists(file_path):
                doc_files.append({
                    "name": file,
                    "path": file_path,
                    "type": "main",
                    "size": os.path.getsize(file_path)
                })
        
        # Check for example files
        if os.path.exists(examples_dir):
            for file in os.listdir(examples_dir):
                if file.endswith(".md"):
                    file_path = os.path.join(examples_dir, file)
                    doc_files.append({
                        "name": file,
                        "path": file_path,
                        "type": "example",
                        "size": os.path.getsize(file_path)
                    })
        
        return {
            "available": len(doc_files) > 0,
            "docs_dir": docs_dir,
            "files": doc_files,
            "total_files": len(doc_files),
            "services_documented": ["BigQuery", "Cloud Storage", "Pub/Sub", "Vertex AI", "Cloud Monitoring", "Compute Engine"],
            "message": f"Found {len(doc_files)} GCP API documentation files"
        }

    @tool 
    def generate_comprehensive_overview(self, base_output_dir: str) -> dict[str, Any]:
        """Generate comprehensive documentation overview including agents and GCP APIs.

        Args:
            base_output_dir: Base directory for all documentation output
        Returns:
            Summary of all documentation generated
        """
        self.logger.info("Generating comprehensive documentation overview")
        
        # Generate agents overview
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        agents_dir = os.path.join(project_root, "universal_agent_architecture", "agents")
        agents_overview_path = os.path.join(base_output_dir, "agents_overview.md")
        
        agents_result = self.generate_agents_overview(agents_dir, agents_overview_path)
        
        # Get GCP API documentation info
        gcp_info = self.get_gcp_api_documentation_info()
        
        # Generate master index
        index_path = os.path.join(base_output_dir, "README.md")
        index_content = f"""# TEAM_ONE Documentation

Comprehensive documentation for the TEAM_ONE agent ecosystem.

**Generated:** {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Agent Documentation

- **[Agents Overview](agents_overview.md)** - Complete list of all available agents and their primary tools
- **Agent Count:** {agents_result.get('count', 0)} agents documented

## Google Cloud Platform APIs

{"✅ **Available** - Comprehensive GCP API documentation" if gcp_info['available'] else "⚠️  **Not Available** - GCP API documentation not found"}

{f"- **Documentation Files:** {gcp_info['total_files']} files" if gcp_info['available'] else ""}
{f"- **Services Covered:** {', '.join(gcp_info['services_documented'])}" if gcp_info['available'] else ""}
{f"- **Location:** `{gcp_info['docs_dir']}`" if gcp_info['available'] else ""}

{"### GCP API Documentation Files" if gcp_info['available'] else ""}

{chr(10).join([f"- **[{file['name']}]({os.path.relpath(file['path'], base_output_dir)})** - {file['type'].title()} documentation" for file in gcp_info['files'] if file['type'] == 'main']) if gcp_info['available'] else ""}

{"#### Usage Examples" if gcp_info['available'] else ""}

{chr(10).join([f"- **[{file['name']}]({os.path.relpath(file['path'], base_output_dir)})** - {file['name'].replace('_examples.md', '').title()} examples" for file in gcp_info['files'] if file['type'] == 'example']) if gcp_info['available'] else ""}

{gcp_info['message']}

## Integration & Usage

### Quick Start with Agents

```python
from multi_tool_agent.agent import create_agent

# Create agent with all available tools
agent = create_agent(
    name='my_agent',
    description='Multi-purpose agent with full toolset access'
)

# Agents automatically include:
# - MCP credentials for Google Cloud authentication  
# - All Google Cloud API tools (BigQuery, Storage, Pub/Sub, etc.)
# - File system operations
# - Web browsing capabilities
# - And more...
```

### Using Google Cloud APIs in Agents

```python
# Example: Data analysis agent with BigQuery access
data_agent = create_agent(
    name='data_analyst',
    instruction='''
    You are a data analysis expert with access to Google Cloud Platform.
    Help users query BigQuery datasets, analyze results, and provide insights.
    Always check API response status and handle errors gracefully.
    '''
)

# The agent can now use GCP tools directly:
# - execute_bigquery_query()
# - list_storage_buckets()
# - publish_pubsub_message()
# - And 30+ other Google Cloud API tools
```

## System Architecture

- **Agents**: Specialized AI assistants with specific roles and capabilities
- **Tools**: Reusable functions that agents can call to perform tasks
- **MCP Server**: Secure credential management for Google Cloud authentication
- **Toolsets**: Collections of related tools (GCP APIs, file operations, etc.)

## Getting Help

1. Check the [Agents Overview](agents_overview.md) to see all available agents
2. Review GCP API documentation for Google Cloud integration details
3. Look at example files to understand usage patterns
4. Run `python3 test_gcp_integration.py` to verify your setup

---

*Documentation automatically generated by the DocumentationAgent.*
"""
        
        os.makedirs(base_output_dir, exist_ok=True)
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(index_content)
        
        return {
            "index_file": index_path,
            "agents_overview": agents_result,
            "gcp_api_docs": gcp_info,
            "total_documentation_files": 1 + agents_result.get('count', 0) + gcp_info.get('total_files', 0)
        }
