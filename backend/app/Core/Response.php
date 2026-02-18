<?php

declare(strict_types=1);

namespace App\Core;

final class Response
{
    public function __construct(
        private mixed $body,
        private int $status = 200,
        private array $headers = ['Content-Type' => 'application/json; charset=utf-8']
    ) {
    }

    public static function json(array $payload, int $status = 200, array $headers = []): self
    {
        return new self($payload, $status, $headers + ['Content-Type' => 'application/json; charset=utf-8']);
    }

    public static function noContent(): self
    {
        return new self(null, 204, []);
    }

    public function send(): void
    {
        $protocol = $_SERVER['SERVER_PROTOCOL'] ?? 'HTTP/1.1';
        header(sprintf('%s %d', $protocol, $this->status), true, $this->status);
        http_response_code($this->status);

        foreach ($this->headers as $name => $value) {
            header($name . ': ' . $value);
        }

        if ($this->status === 204) {
            return;
        }

        echo json_encode($this->body, JSON_UNESCAPED_SLASHES);
    }
}
