import { Ast, ComponentGroup } from "#compiler/ast";
import { FunctionCollectingVisitor } from "./visitor/function-collecting-visitor";
import { TypeNameIndexingVisitor } from "./visitor/type-name-indexing-visitor";
import { ReferenceExpressionVisitor } from "./visitor/reference-expression-visitor";
import { ReferenceTypeVisitor } from "./visitor/reference-type-visitor";
import { FunctionFlatteningVisitor } from "./visitor/function-flattening-visitor";
import { StoreTypeVisitor } from "./visitor/store-type-visitor";
import { NameFlatteningVisitor } from "./visitor/name-flattening-visitor";
import { PartialInvokationVisitor } from "./visitor/partial-invokation-visitor";
import { LambdaVisitor } from "./visitor/lambda-visitor";
import { IterateExpressionVisitor } from "./visitor/iterate-expression-visitor";
import { IterableVisitor } from "./visitor/iterable-visitor";
import { ReduceVisitor } from "./visitor/reduce-visitor";
import { EmptyVisitor } from "./visitor/empty-visitor";
import { ConcatVisitor } from "./visitor/concat-visitor";

export function LinkCinderblock(ast: Ast) {
  const function_collector = new FunctionCollectingVisitor();
  const type_collector = new TypeNameIndexingVisitor();

  const iterate_visitor = new IterateExpressionVisitor();
  const lambda_visitor = new LambdaVisitor(function_collector.Functions);
  const iterable_visitor = new IterableVisitor();
  const empty_visitor = new EmptyVisitor();
  const concat_visitor = new ConcatVisitor();

  ast = ast
    .visited(new ReduceVisitor())
    .visited(function_collector)
    .visited(type_collector)
    .visited(iterable_visitor)
    .visited(new ReferenceExpressionVisitor(function_collector.Functions))
    .visited(new ReferenceTypeVisitor(type_collector.Types))
    .visited(new FunctionFlatteningVisitor(function_collector.Functions))
    .visited(new StoreTypeVisitor(type_collector.Types))
    .visited(new NameFlatteningVisitor())
    .visited(new PartialInvokationVisitor())
    .visited(iterate_visitor)
    .visited(lambda_visitor)
    .visited(empty_visitor)
    .visited(concat_visitor);

  return new Ast(
    new ComponentGroup(
      ...ast.iterator(),
      lambda_visitor.Namespace,
      iterate_visitor.Namespace,
      iterable_visitor.Namespace,
      empty_visitor.Namespace,
      concat_visitor.Namespace
    )
  );
}
