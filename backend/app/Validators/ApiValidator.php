<?php

declare(strict_types=1);

namespace App\Validators;

use App\Core\HttpException;

final class ApiValidator
{
    public static function requiredString(mixed $value, string $field, int $maxLength = 255): string
    {
        $string = trim((string) $value);
        if ($string === '') {
            throw new HttpException(422, 'validation_error', $field . ' is required.');
        }

        if (mb_strlen($string) > $maxLength) {
            throw new HttpException(422, 'validation_error', $field . ' exceeds max length.');
        }

        return $string;
    }

    public static function optionalString(mixed $value, string $field, int $maxLength = 65535): ?string
    {
        if ($value === null) {
            return null;
        }

        $string = trim((string) $value);
        if ($string === '') {
            return null;
        }

        if (mb_strlen($string) > $maxLength) {
            throw new HttpException(422, 'validation_error', $field . ' exceeds max length.');
        }

        return $string;
    }

    public static function requiredInt(mixed $value, string $field, int $min = 1): int
    {
        if (!is_numeric($value)) {
            throw new HttpException(422, 'validation_error', $field . ' must be a number.');
        }

        $number = (int) $value;
        if ($number < $min) {
            throw new HttpException(422, 'validation_error', $field . ' is invalid.');
        }

        return $number;
    }

    public static function optionalInt(mixed $value, string $field, int $min = 0): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!is_numeric($value)) {
            throw new HttpException(422, 'validation_error', $field . ' must be a number.');
        }

        $number = (int) $value;
        if ($number < $min) {
            throw new HttpException(422, 'validation_error', $field . ' is invalid.');
        }

        return $number;
    }

    public static function requiredEnum(mixed $value, string $field, array $allowed): string
    {
        $string = trim((string) $value);
        if (!in_array($string, $allowed, true)) {
            throw new HttpException(422, 'validation_error', $field . ' is invalid.');
        }

        return $string;
    }

    public static function optionalEnum(mixed $value, string $field, array $allowed): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return self::requiredEnum($value, $field, $allowed);
    }

    public static function optionalDecimal(mixed $value, string $field, float $min = 0): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!is_numeric($value)) {
            throw new HttpException(422, 'validation_error', $field . ' must be numeric.');
        }

        $decimal = (float) $value;
        if ($decimal < $min) {
            throw new HttpException(422, 'validation_error', $field . ' is invalid.');
        }

        return $decimal;
    }

    public static function optionalBool(mixed $value, string $field): ?bool
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));
            if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
                return true;
            }
            if (in_array($normalized, ['0', 'false', 'no', 'off'], true)) {
                return false;
            }
        }

        if (is_int($value)) {
            if ($value === 1) {
                return true;
            }
            if ($value === 0) {
                return false;
            }
        }

        throw new HttpException(422, 'validation_error', $field . ' must be boolean.');
    }

    public static function optionalDate(mixed $value, string $field): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $date = trim((string) $value);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            throw new HttpException(422, 'validation_error', $field . ' must be YYYY-MM-DD.');
        }

        return $date;
    }
}
