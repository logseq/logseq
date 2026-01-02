package logseq.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.Instant

/**
 * Security validation for repository data
 */
object RepositoryValidation {
    private const val MAX_ID_LENGTH = 100
    private const val MAX_KEY_LENGTH = 255
    private const val MAX_VALUE_LENGTH = 10000

    fun validateId(id: String?): String {
        requireNotNull(id) { "ID cannot be null" }
        require(id.length <= MAX_ID_LENGTH) { "ID exceeds maximum length" }
        require(id.isNotBlank()) { "ID cannot be blank" }
        require(!id.contains('\u0000')) { "ID contains null bytes" }
        return id.trim()
    }

    fun validateKey(key: String?): String {
        val validated = validateId(key)
        require(validated.length <= MAX_KEY_LENGTH) { "Key exceeds maximum length" }
        require(!validated.contains("..")) { "Key contains directory traversal patterns" }
        require(!validated.contains("/")) { "Key contains path separators" }
        require(!validated.contains("\\")) { "Key contains backslashes" }
        return validated
    }

    fun validateValue(value: Any?): Any {
        requireNotNull(value) { "Value cannot be null" }
        when (value) {
            is String -> {
                require(value.length <= MAX_VALUE_LENGTH) { "String value exceeds maximum length" }
                require(!value.contains('\u0000')) { "Value contains null bytes" }
                require(!value.any { it.code in 0x00..0x1F || it.code in 0x80..0x9F }) {
                    "Value contains control characters"
                }
                return value.trim()
            }
            is Number -> return value
            is Boolean -> return value
            else -> throw IllegalArgumentException("Unsupported value type: ${value::class}")
        }
    }
}

/**
 * Represents a property entity in Logseq's data model
 */
data class Property(
    val id: String,
    val key: String,
    val value: Any,
    val entityId: String, // ID of the block or page this property belongs to
    val entityType: EntityType,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    init {
        RepositoryValidation.validateId(id)
        RepositoryValidation.validateKey(key)
        RepositoryValidation.validateValue(value)
        RepositoryValidation.validateId(entityId)
    }
}

/**
 * Type of entity that owns the property
 */
enum class EntityType {
    BLOCK,
    PAGE
}

/**
 * Search criteria for property queries
 */
data class PropertySearchCriteria(
    val key: String? = null,
    val value: Any? = null,
    val entityId: String? = null,
    val entityType: EntityType? = null,
    val keys: List<String>? = null,
    val createdAfter: Instant? = null,
    val createdBefore: Instant? = null,
    val updatedAfter: Instant? = null,
    val updatedBefore: Instant? = null
) {
    init {
        key?.let { RepositoryValidation.validateKey(it) }
        value?.let { RepositoryValidation.validateValue(it) }
        entityId?.let { RepositoryValidation.validateId(it) }
        keys?.forEach { RepositoryValidation.validateKey(it) }
    }
}

/**
 * Property repository interface for metadata operations
 */
interface PropertyRepository : BaseRepository<Property, String> {

    // CRUD operations (inherited from BaseRepository)

    // Entity-specific queries
    suspend fun findByEntityId(entityId: String, entityType: EntityType): List<Property>
    suspend fun findByEntityIds(entityIds: List<String>, entityType: EntityType): Map<String, List<Property>>
    suspend fun findByKeyAndEntityType(key: String, entityType: EntityType, pagination: Pagination = Pagination()): Page<Property>

    // Key-based queries
    suspend fun findByKey(key: String, pagination: Pagination = Pagination()): Page<Property>
    suspend fun findDistinctKeys(entityType: EntityType? = null): List<String>
    suspend fun countByKey(key: String): Long

    // Value-based queries
    suspend fun findByValue(value: Any, pagination: Pagination = Pagination()): Page<Property>
    suspend fun findByValuePattern(pattern: String, pagination: Pagination = Pagination()): Page<Property>

    // Search operations
    suspend fun search(criteria: PropertySearchCriteria, pagination: Pagination = Pagination()): Page<Property>

    // Bulk operations
    suspend fun savePropertiesForEntity(entityId: String, entityType: EntityType, properties: Map<String, Any>): List<Property>
    suspend fun updatePropertiesForEntity(entityId: String, entityType: EntityType, properties: Map<String, Any>): List<Property>
    suspend fun deletePropertiesForEntity(entityId: String, entityType: EntityType): Boolean
    suspend fun deleteByKeyAndEntityId(key: String, entityId: String, entityType: EntityType): Boolean

    // Property value operations
    suspend fun getPropertyValue(entityId: String, entityType: EntityType, key: String): Any?
    suspend fun setPropertyValue(entityId: String, entityType: EntityType, key: String, value: Any): Property
    suspend fun incrementNumericProperty(entityId: String, entityType: EntityType, key: String, increment: Number = 1): Property?

    // Type-specific queries
    suspend fun findPropertiesWithType(type: PropertyValueType, pagination: Pagination = Pagination()): Page<Property>
    suspend fun findDateProperties(pagination: Pagination = Pagination()): Page<Property>
    suspend fun findNumericProperties(pagination: Pagination = Pagination()): Page<Property>
    suspend fun findBooleanProperties(pagination: Pagination = Pagination()): Page<Property>
    suspend fun findArrayProperties(pagination: Pagination = Pagination()): Page<Property>
    suspend fun findObjectProperties(pagination: Pagination = Pagination()): Page<Property>

    // Flow-based operations for reactive updates
    fun observePropertiesForEntity(entityId: String, entityType: EntityType): Flow<List<Property>>
    fun observeProperty(entityId: String, entityType: EntityType, key: String): Flow<Property?>
    fun observePropertiesByKey(key: String): Flow<List<Property>>

    // Validation and constraints
    suspend fun validatePropertyValue(key: String, value: Any): Boolean
    suspend fun getAllowedValuesForProperty(key: String): List<Any>?

    // Schema operations
    suspend fun getPropertySchema(key: String): PropertySchema?
    suspend fun updatePropertySchema(key: String, schema: PropertySchema): PropertySchema
}

/**
 * Property value types
 */
enum class PropertyValueType {
    STRING,
    NUMBER,
    BOOLEAN,
    DATE,
    ARRAY,
    OBJECT
}

/**
 * Property schema definition
 */
data class PropertySchema(
    val key: String,
    val type: PropertyValueType,
    val required: Boolean = false,
    val defaultValue: Any? = null,
    val allowedValues: List<Any>? = null,
    val description: String? = null,
    val validationRules: List<PropertyValidationRule> = emptyList()
)

/**
 * Property validation rule
 */
data class PropertyValidationRule(
    val type: ValidationRuleType,
    val value: Any? = null,
    val message: String? = null
)

/**
 * Validation rule types
 */
enum class ValidationRuleType {
    REQUIRED,
    MIN_LENGTH,
    MAX_LENGTH,
    MIN_VALUE,
    MAX_VALUE,
    PATTERN,
    CUSTOM
}