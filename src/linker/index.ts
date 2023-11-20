import { Ast, ComponentGroup } from "#compiler/ast";
import { FunctionCollectingVisitor } from "./visitor/function-collecting-visitor";
import { TypeNameIndexingVisitor } from "./visitor/type-name-indexing-visitor";
import { ReferenceExpressionVisitor } from "./visitor/reference-expression-visitor";
import { ReferenceTypeVisitor } from "./visitor/reference-type-visitor";
import { FunctionFlatteningVisitor } from "./visitor/function-flattening-visitor";
import { StoreTypeVisitor } from "./visitor/store-type-visitor";
import { NameFlatteningVisitor } from "./visitor/name-flattening-visitor";
import { PartialInvokationVisitor } from "./visitor/partial-invokation-visitor";
import { LambdaSwappingVisitor } from "./visitor/lambda-swapping-visitor";
import { IterateExpressionVisitor } from "./visitor/iterate-expression-visitor";
import { IterableVisitor } from "./visitor/iterable-visitor";
import { ReduceVisitor } from "./visitor/reduce-visitor";
import { EmptyVisitor } from "./visitor/empty-visitor";
import { ConcatVisitor } from "./visitor/concat-visitor";
import { GenericFlatteningVisitor } from "./visitor/generic-flattening-visitor";
import { BuiltInFunctions } from "./built-in-functions";
import { LambdaReferencingVisitor } from "./visitor/lambda-referencing-visitor";

export function LinkCinderblock(ast: Ast) {
  const function_collector = new FunctionCollectingVisitor();
  const type_collector = new TypeNameIndexingVisitor();

  const iterate_visitor = new IterateExpressionVisitor();
  const lambda_visitor = new LambdaSwappingVisitor(
    function_collector.Functions
  );
  const iterable_visitor = new IterableVisitor();
  const empty_visitor = new EmptyVisitor();
  const concat_visitor = new ConcatVisitor();

  const generic_flattening_visitor = new GenericFlatteningVisitor();

  ast = ast
    .with(BuiltInFunctions)
    .visited(new ReduceVisitor())
    .visited(iterable_visitor)
    .visited(function_collector)
    .visited(type_collector)
    .visited(new ReferenceExpressionVisitor(function_collector.Functions))
    .visited(new ReferenceTypeVisitor(type_collector.Types))
    .visited(new FunctionFlatteningVisitor(function_collector.Functions))
    .visited(new StoreTypeVisitor(type_collector.Types))
    .visited(new NameFlatteningVisitor())
    .visited(new PartialInvokationVisitor())
    .visited(iterate_visitor)
    .visited(lambda_visitor);

  const lambda_reference_visitor = new LambdaReferencingVisitor(
    lambda_visitor.Data
  );

  ast = ast
    .visited(lambda_reference_visitor)
    .visited(empty_visitor)
    .visited(concat_visitor)
    .visited(generic_flattening_visitor);

  while (generic_flattening_visitor.FoundAny) {
    generic_flattening_visitor.Reset();
    ast = ast.visited(generic_flattening_visitor);
  }

  return new Ast(
    new ComponentGroup(
      ...ast.iterator(),
      lambda_visitor.Namespace,
      iterate_visitor.Namespace,
      iterable_visitor.Namespace,
      empty_visitor.Namespace,
      concat_visitor.Namespace,
      generic_flattening_visitor.Namespace
    )
  );
}
