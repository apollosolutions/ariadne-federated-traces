from ariadne.types import Extension
from base64 import b64encode
from inspect import isawaitable

from .TraceTreeBuilder import TraceTreeBuilder

class InlineTraceExtension(Extension):
    def __init__(self):
        self.should_trace = True
        self.tree_builder = TraceTreeBuilder()

    def request_started(self, context):
        ftv1_header = context["request"].headers.get("apollo-federation-include-trace", None)
        if not ftv1_header:
            self.should_trace = False
        else:
            self.tree_builder.start_timing()

    async def resolve(
        self, next_, parent, info, **kwargs
    ):
        if not self.should_trace:
            result = next_(parent, info, **kwargs)
            if isawaitable(result):
                result = await result
            return result
        
        end_node_trace = self.tree_builder.will_resolve_field(info)
        try:
            result = next_(parent, info, **kwargs)
            if isawaitable(result):
                result = await result
            return result
        finally:
            end_node_trace()
    
    def has_errors(self, errors, context):
        self.tree_builder.did_encounter_errors(errors, context)

    def format(self, context):
        if self.should_trace:
            self.tree_builder.stop_timing()
            self.tree_builder.add_nodes_to_trace()

            ftv1 = str(b64encode(self.tree_builder.trace.SerializeToString()), "utf8")

            return {
                "ftv1": ftv1
            }