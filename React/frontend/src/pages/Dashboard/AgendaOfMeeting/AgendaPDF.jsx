
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts if needed, but Helvetica is default
// Font.register({ family: 'Roboto', src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxK.woff2' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30, // Approx 10mm-ish
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#000000',
    },
    // Border helper
    borderBox: {
        border: '1pt solid #000000',
        marginBottom: 0,
    },
    // Header Row
    headerRow: {
        flexDirection: 'row',
        height: 60, // Reduced from 80
        borderBottom: '1pt solid #000000',
    },
    logoSection: {
        width: '30%', // Reduced from 60%
        borderRight: '1pt solid #000000',
        padding: 5,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
    },
    logo: {
        width: 150,
        height: 50,
        objectFit: 'contain',
    },
    companyDetails: {
        flexDirection: 'column',
        justifyContent: 'center',
    },
    companyName: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: '#1e3a8a', // Blue-900
        textTransform: 'uppercase',
    },
    companySub: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#1e40af', // Blue-800
    },
    companyTag: {
        fontSize: 7,
        fontFamily: 'Helvetica-Oblique', // Italic
        color: '#2563eb', // Blue-600
    },
    meetingSection: {
        width: '40%',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 20,
    },
    meetingText: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
    },
    // Info Rows
    infoRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        minHeight: 20,
        // alignItems: 'center', // REMOVED to allow borders to stretch
    },
    infoLabel: {
        fontFamily: 'Helvetica-Bold',
    },
    // Participants Table
    tableHeader: {
        backgroundColor: '#f3f4f6', // Gray-100
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        textAlign: 'center',
        // padding: 2, // REMOVED to allow full height borders
        fontFamily: 'Helvetica-Bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
    },
    colOrganization: { width: '25%', borderRight: '1pt solid #000000', padding: 4, justifyContent: 'center', alignItems: 'center', fontFamily: 'Helvetica-Bold' },
    colResponsibility: { width: '20%', borderRight: '1pt solid #000000', padding: 4, justifyContent: 'center', alignItems: 'center' },
    colContact: { width: '35%', borderRight: '1pt solid #000000', padding: 4, justifyContent: 'center' },
    colDesignation: { width: '20%', padding: 4, justifyContent: 'center', fontFamily: 'Helvetica-Oblique', color: '#000000' },

    // ... (rest of styles)

    // And update the Usage within the render:
    // ...
    // ...

    // Since I cannot match multiple diverse blocks easily with one simplistic invalid replace command (the tool can't handle non-contiguous blocks unless multi_replace which I should use or do separate calls).
    // Let's modify the Style definition first.


    // Points Table
    pointsHeader: {
        backgroundColor: '#e5e7eb', // Gray-200
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        height: 25,
        // alignItems: 'center', // REMOVED
        fontFamily: 'Helvetica-Bold',
    },
    colSl: { width: 45, borderRight: '1pt solid #000000', textAlign: 'center', padding: 2, justifyContent: 'center' },
    colDesc: { width: '60%', borderRight: '1pt solid #000000', padding: 4, justifyContent: 'center' },
    colRemarks: { flex: 1, padding: 4, justifyContent: 'center' },

    pointRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        minHeight: 20,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
        fontSize: 8,
    },

});

// Helper for title case
const toTitleCase = (str) => {
    if (!str) return "";
    return String(str)
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const AgendaPDF = ({ agendaDetails, project }) => {
    const dateStr = agendaDetails.date
        ? new Date(agendaDetails.date).toLocaleDateString("en-GB", {
            day: "numeric", month: "long", year: "numeric"
        })
        : "-";

    const clientName = project?.Employer || agendaDetails.client_name;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Main Border Box */}
                <View style={styles.borderBox}>

                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.logoSection}>
                            <Image src="/Mano-Logo.png" style={styles.logo} />
                        </View>
                        <View style={{ width: '70%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 20 }}>
                            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 14 }}>AGENDA - {agendaDetails.meeting_no}</Text>
                        </View>
                    </View>

                    {/* Client Row */}
                    <View style={[styles.infoRow, { padding: 4, flexDirection: 'row', alignItems: 'center' }]}>
                        <Text style={styles.infoLabel}>Client : </Text>
                        <Text>{clientName}</Text>
                    </View>

                    {/* Project & Job Row */}
                    <View style={styles.infoRow}>
                        <View style={{ width: '70%', borderRight: '1pt solid #000000', padding: 4, flexDirection: 'row' }}>
                            <Text style={styles.infoLabel}>Project : </Text>
                            <Text style={{ flex: 1 }}>{agendaDetails.project_name}</Text>
                        </View>
                        <View style={{ width: '30%', padding: 4, flexDirection: 'row' }}>
                            <Text style={styles.infoLabel}>JOB No : </Text>
                            <Text style={{ flex: 1 }}>2223-57 {agendaDetails.job_no}</Text>
                        </View>
                    </View>

                    {/* Subject, Venue, Date Row */}
                    <View style={styles.infoRow}>
                        <View style={{ width: '35%', borderRight: '1pt solid #000000', padding: 4, flexDirection: 'row' }}>
                            <Text style={styles.infoLabel}>Subject : </Text>
                            <Text style={{ flex: 1 }}>{agendaDetails.subject}</Text>
                        </View>
                        <View style={{ width: '35%', borderRight: '1pt solid #000000', padding: 4, flexDirection: 'row' }}>
                            <Text style={styles.infoLabel}>Venue : </Text>
                            <Text style={{ flex: 1 }}>{agendaDetails.venue}</Text>
                        </View>
                        <View style={{ width: '30%', padding: 4, flexDirection: 'row' }}>
                            <Text style={styles.infoLabel}>Date : </Text>
                            <Text style={{ flex: 1 }}>{dateStr}</Text>
                        </View>
                    </View>

                    {/* Participants Header */}
                    <View style={{ backgroundColor: '#f3f4f6', padding: 2, textAlign: 'center', borderBottom: '1pt solid #000000' }}>
                        <Text style={[styles.infoLabel, { fontSize: 9 }]}>Participants</Text>
                    </View>

                    {/* Participants Table Header */}
                    <View style={styles.tableHeader}>
                        <View style={{ width: '25%', borderRight: '1pt solid #000000', padding: 2, justifyContent: 'center' }}><Text>Organization</Text></View>
                        <View style={{ width: '20%', borderRight: '1pt solid #000000', padding: 2, justifyContent: 'center' }}><Text>Responsibility</Text></View>
                        <View style={{ width: '55%', padding: 2, justifyContent: 'center' }}><Text>Representatives</Text></View>
                    </View>

                    {/* Participants Rows */}
                    {agendaDetails.processedParticipants.map((group, gIdx) => (
                        <View key={gIdx} style={styles.tableRow}>
                            <View style={styles.colOrganization}>
                                <Text>{toTitleCase(group.company_name)}</Text>
                            </View>

                            {/* Nested Rows Loop for Responsibility & Representatives */}
                            <View style={{ width: '75%', flexDirection: 'column' }}>
                                {group.participants.map((p, pIdx) => (
                                    <View key={pIdx} style={{
                                        flexDirection: 'row',
                                        borderBottom: pIdx !== group.participants.length - 1 ? '1pt solid #000000' : 'none',
                                        minHeight: 20,
                                    }}>
                                        <View style={{ width: '26.67%', borderRight: '1pt solid #000000', padding: 4, justifyContent: 'center', alignItems: 'center' }}>
                                            <Text>{p.responsibilities || "-"}</Text>
                                        </View>
                                        <View style={{ width: '46.66%', borderRight: '1pt solid #000000', padding: 4, justifyContent: 'center' }}>
                                            <Text>{toTitleCase(p.contact_person)}</Text>
                                        </View>
                                        <View style={{ width: '26.67%', padding: 4, justifyContent: 'center' }}>
                                            <Text style={{ fontFamily: 'Helvetica-Oblique', color: '#000000' }}>{p.designation}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Points Table Header */}
                    <View style={styles.pointsHeader}>
                        <View style={styles.colSl}><Text>Sl No.</Text></View>
                        <View style={styles.colDesc}><Text>Description</Text></View>
                        <View style={styles.colRemarks}><Text>Remarks</Text></View>
                    </View>

                    {/* Points Rows */}
                    {agendaDetails.processedPoints.map((point, idx) => (
                        <View key={idx} style={[styles.pointRow, { borderBottom: idx === agendaDetails.processedPoints.length - 1 ? 0 : '1pt solid #000000' }]}>
                            <View style={styles.colSl}>
                                <Text>{point.no || point.sl}</Text>
                            </View>
                            <View style={styles.colDesc}>
                                <Text>{point.description}</Text>
                            </View>
                            <View style={styles.colRemarks}>
                                <Text>{point.remarks || ""}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Page ${pageNumber} of ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
};

export default AgendaPDF;
