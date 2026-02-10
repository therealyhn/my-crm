<?php

declare(strict_types=1);

namespace App\Core;

final class App
{
    public function __construct(private readonly Router $router)
    {
    }

    public function run(Request $request): Response
    {
        $resolved = $this->router->resolve($request);

        $core = function (Request $nextRequest) use ($resolved): Response {
            $handler = $resolved['handler'];
            $params = $resolved['params'];

            if (is_array($handler) && count($handler) === 2 && is_string($handler[0]) && is_string($handler[1])) {
                $controller = new $handler[0]();
                return $controller->{$handler[1]}($nextRequest, $params);
            }

            return $handler($nextRequest, $params);
        };

        $pipeline = array_reduce(
            array_reverse($resolved['middleware']),
            static function (callable $next, string $middlewareClass): callable {
                return static function (Request $pipelineRequest) use ($next, $middlewareClass): Response {
                    $middleware = new $middlewareClass();
                    if (!$middleware instanceof MiddlewareInterface) {
                        throw new HttpException(500, 'server_error', 'Invalid middleware configuration.');
                    }

                    return $middleware->handle($pipelineRequest, $next);
                };
            },
            $core
        );

        return $pipeline($request);
    }
}
