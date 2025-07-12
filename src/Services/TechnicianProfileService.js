import mongoose from 'mongoose';
import { DBNames } from '../db.js';

class TechnicianProfileService {

    static async getTechnicianCompleteProfile(technicianId, MongoClient) {

        const pipeline = [
            {
                $match: {
                    id: parseInt(technicianId)
                }
            },
            {
                $lookup: {
                    from: "details_technician_courses",
                    localField: "id",
                    foreignField: "technical_id",
                    as: "details_technician_courses"
                }
            },
            {
                $unwind: {
                    path: "$details_technician_courses",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "social_security_details_technicians",
                    localField: "id",
                    foreignField: "technical_id",
                    as: "details_social_security"
                }
            },
            {
                $unwind: {
                    path: "$details_social_security",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "course_catalogs",
                    localField:
                        "details_technician_courses.course_catalog_id",
                    foreignField: "_id",
                    as: "course_info"
                }
            },
            {
                $unwind: {
                    path: "$course_info",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "social_security_entity_catalogs",
                    localField:
                        "details_social_security.social_security_entity_id",
                    foreignField: "_id",
                    as: "social_security_entity"
                }
            },
            {
                $unwind: {
                    path: "$social_security_entity",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    "course_info.profession_id": {
                        $cond: {
                            if: { $ne: ["$course_info", null] },
                            then: { $toString: "$course_info.profession_id" },
                            else: null
                        }
                    },
                    "course_info._id": {
                        $cond: {
                            if: { $ne: ["$course_info", null] },
                            then: { $toString: "$course_info._id" },
                            else: null
                        }
                    },
                    "social_security_entity._id": {
                        $cond: {
                            if: { $ne: ["$social_security_entity", null] },
                            then: { $toString: "$social_security_entity._id" },
                            else: null
                        }
                    },
                    id: {
                        $toString: "$id"
                    }
                }
            },
            {
                $lookup: {
                    from: "technical_stars",
                    let: {
                        tech_id: "$id"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$technical_id", "$$tech_id"]
                                }
                            }
                        },
                        {
                            $sort: {
                                created_at: -1
                            }
                        },
                        // Ordena por fecha descendente
                        {
                            $limit: 1
                        }
                    ],
                    as: "value_start"
                }
            },
            {
                $unwind: {
                    path: "$value_start",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "technical_stars_services_detail",
                    let: {
                        tech_id: "$id"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$technical_id", "$$tech_id"]
                                }
                            }
                        },
                        {
                            $sort: {
                                created_at: -1
                            }
                        },
                        // Ordena por fecha descendente
                        {
                            $limit: 5
                        }
                    ],
                    as: "technical_stars_services_detail"
                }
            },
            {
                $unwind: {
                    path: "$technical_stars_services_detail",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    "technical_stars_services_detail.client_id":
                        {
                            $convert: {
                                input:
                                    "$technical_stars_services_detail.client_id",
                                to: "int",
                                onError: null,
                                // evita que se rompa si no es convertible
                                onNull: null
                            }
                        }
                }
            },
            {
                $lookup: {
                    from: "UserCopy",
                    localField:
                        "technical_stars_services_detail.client_id",
                    foreignField: "id",
                    as: "client_info"
                }
            },
            {
                $unwind: {
                    path: "$client_info",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "professions_technical_details",
                    localField: "id",
                    foreignField: "technical_id",
                    as: "professions_technical_details"
                }
            },
            {
                $unwind: {
                    path: "$professions_technical_details",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    "professions_technical_details.profession_id": {
                        $cond: {
                            if: { $ne: ["$professions_technical_details", null] },
                            then: { $toObjectId: "$professions_technical_details.profession_id" },
                            else: null
                        }
                    }
                }
            },
            {
                $lookup:{
                    from: "professions",
                    localField: "professions_technical_details.profession_id",
                    foreignField: "_id",
                    as: "professions"
                }
            },
            {
                $unwind:{
                    path: "$professions",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$id",
                    name: {
                        $first: "$name"
                    },
                    last_name: {
                        $first: "$last_name"
                    },
                    photo_profile: {
                        $first: "$photo_profile"
                    },
                    value_start: {
                        $first: "$value_start"
                    },
                    created_at: {
                        $first: "$created_at"
                    },
                    course_catalog: {
                        $addToSet: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $ne: ["$course_info", null] },
                                        { $ne: ["$course_info._id", null] }
                                    ]
                                },
                                then: "$course_info",
                                else: "$$REMOVE"
                            }
                        }
                    },
                    social_security_entity: {
                        $addToSet: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $ne: ["$social_security_entity", null] },
                                        { $ne: ["$social_security_entity._id", null] }
                                    ]
                                },
                                then: "$social_security_entity",
                                else: "$$REMOVE"
                            }
                        }
                    },
                    technical_stars_services_detail: {
                        $addToSet: {
                            $cond: {
                                if: { $ne: ["$technical_stars_services_detail", null] },
                                then: "$technical_stars_services_detail",
                                else: "$$REMOVE"
                            }
                        }
                    },
                    client_info: {
                        $addToSet: {
                            $cond: {
                                if: { $ne: ["$client_info", null] },
                                then: "$client_info",
                                else: "$$REMOVE"
                            }
                        }
                    },
                    professions_technical_details: {
                        $first: "$professions_technical_details"
                    },
                    professions: {
                        $addToSet: {
                            $cond: {
                                if: { $ne: ["$professions", null] },
                                then: "$professions",
                                else: "$$REMOVE"
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    last_name: 1,
                    photo_profile: 1,
                    value_start: "$value_start.value",
                    active_time: "$created_at",
                    courses_data: {
                        $let: {
                            vars: {
                                filtered: {
                                    $filter: {
                                        input: {
                                            $map: {
                                                input: "$course_catalog",
                                                as: "course",
                                                in: {
                                                    $cond: {
                                                        if: { $ne: ["$$course", null] },
                                                        then: {
                                                            id: "$$course._id",
                                                            course_name: "$$course.course_name",
                                                            course_label: "$$course.course_label",
                                                            profession_id: "$$course.profession_id"
                                                        },
                                                        else: null
                                                    }
                                                }
                                            }
                                        },
                                        as: "item",
                                        cond: { $ne: ["$$item", null] }
                                    }
                                }
                            },
                            in: {
                                $cond: {
                                    if: { $eq: [{ $size: "$$filtered" }, 0] },
                                    then: null,
                                    else: "$$filtered"
                                }
                            }
                        }
                    },
                    social_security_data: {
                        $let: {
                            vars: {
                                filtered: {
                                    $filter: {
                                        input: {
                                            $map: {
                                                input: "$social_security_entity",
                                                as: "entity",
                                                in: {
                                                    $cond: {
                                                        if: { $ne: ["$$entity", null] },
                                                        then: {
                                                            id: "$$entity._id",
                                                            type: "$$entity.type",
                                                            entity_name: "$$entity.entity_name"
                                                        },
                                                        else: null
                                                    }
                                                }
                                            }
                                        },
                                        as: "item",
                                        cond: { $ne: ["$$item", null] }
                                    }
                                }
                            },
                            in: {
                                $cond: {
                                    if: { $eq: [{ $size: "$$filtered" }, 0] },
                                    then: null,
                                    else: "$$filtered"
                                }
                            }
                        }
                    },
                    comments: {
                        $let: {
                            vars: {
                                filtered: {
                                    $filter: {
                                        input: {
                                            $map: {
                                                input: "$technical_stars_services_detail",
                                                as: "comment",
                                                in: {
                                                    $cond: {
                                                        if: { $ne: ["$$comment", null] },
                                                        then: {
                                                            comment: "$$comment.description",
                                                            client_id: "$$comment.client_id",
                                                            client_name: {
                                                                $let: {
                                                                    vars: {
                                                                        client: {
                                                                            $arrayElemAt: [
                                                                                {
                                                                                    $filter: {
                                                                                        input: "$client_info",
                                                                                        as: "c",
                                                                                        cond: {
                                                                                            $eq: [
                                                                                                "$$c.id",
                                                                                                "$$comment.client_id"
                                                                                            ]
                                                                                        }
                                                                                    }
                                                                                },
                                                                                0
                                                                            ]
                                                                        }
                                                                    },
                                                                    in: {
                                                                        $cond: {
                                                                            if: { $gt: ["$$client", null] },
                                                                            then: {
                                                                                $concat: ["$$client.name", " ", "$$client.last_name"]
                                                                            },
                                                                            else: "Cliente desconocido"
                                                                        }
                                                                    }
                                                                }
                                                            },
                                                            qualification_start: "$$comment.value"
                                                        },
                                                        else: null
                                                    }
                                                }
                                            }
                                        },
                                        as: "item",
                                        cond: { $ne: ["$$item", null] }
                                    }
                                }
                            },
                            in: {
                                $cond: {
                                    if: { $eq: [{ $size: "$$filtered" }, 0] },
                                    then: null,
                                    else: "$$filtered"
                                }
                            }
                        }
                    },
                    professions: {
                        $let: {
                            vars: {
                                filtered: {
                                    $filter: {
                                        input: {
                                            $map: {
                                                input: "$professions",
                                                as: "profession",
                                                in: {
                                                    $cond: {
                                                        if: { $ne: ["$$profession", null] },
                                                        then: {
                                                            id: "$$profession._id",
                                                            profession_name: "$$profession.name",
                                                            profession_label: "$$profession.slug_name"
                                                        },
                                                        else: null
                                                    }
                                                }
                                            }
                                        },
                                        as: "item",
                                        cond: { $ne: ["$$item", null] }
                                    }
                                }
                            },
                            in: {
                                $cond: {
                                    if: { $eq: [{ $size: "$$filtered" }, 0] },
                                    then: null,
                                    else: "$$filtered"
                                }
                            }
                        }
                    }
                }
            }
        ]

        try {
            const result = await MongoClient.collection(DBNames.UserCopy)
                .aggregate(pipeline)
                .toArray();
            if (result.length > 0) {
                return result[0];
            } else {
                return null; // No se encontró el técnico
            }
        } catch (error) {
            console.error("Error al obtener el perfil del técnico:", error);
            throw error; // Propaga el error para manejarlo en el controlador
        }
    }
}

export default TechnicianProfileService;